// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import earcut from "earcut";
import computeLayout from "opentype-layout-improved";
import { FontCache } from "@/lib/designer/fontcache";

export enum TextAlign {
  Left = "left",
  Center = "center",
  Right = "right",
}

export enum TextAlignVertical {
  Top = "top",
  Center = "center",
  Bottom = "bottom",
}
// font rendering from: https://codepen.io/Anemolo/pen/jOOYmEZ

function distance(p1, p2) {
  const dx = p1.x - p2.x,
    dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function lerp(p1, p2, t) {
  return { x: (1 - t) * p1.x + t * p2.x, y: (1 - t) * p1.y + t * p2.y };
}

function cross(p1, p2) {
  return p1.x * p2.y - p1.y * p2.x;
}

// bezier discretization
const MAX_BEZIER_STEPS = 10;
const BEZIER_STEP_SIZE = 3.0;
// this is for inside checks - doesn't have to be particularly
// small because glyphs have finite resolution
const EPSILON = 1e-6;
const FALLBACK_FONT_INTERVAL = 200;
const TIMER_INTERVAL = 50;

// class for converting path commands into point data
class Polygon {
  points = [];
  children = [];
  area = 0.0;

  moveTo(p) {
    this.points.push(p);
  }

  lineTo(p) {
    this.points.push(p);
  }

  close() {
    let cur = this.points[this.points.length - 1];
    this.points.forEach((next) => {
      this.area += 0.5 * cross(cur, next);
      cur = next;
    });
  }

  conicTo(p, p1) {
    const p0 = this.points[this.points.length - 1];
    const dist = distance(p0, p1) + distance(p1, p);
    const steps = Math.max(
      2,
      Math.min(MAX_BEZIER_STEPS, dist / BEZIER_STEP_SIZE)
    );
    for (let i = 1; i <= steps; ++i) {
      const t = i / steps;
      this.points.push(lerp(lerp(p0, p1, t), lerp(p1, p, t), t));
    }
  }

  cubicTo(p, p1, p2) {
    const p0 = this.points[this.points.length - 1];
    const dist = distance(p0, p1) + distance(p1, p2) + distance(p2, p);
    const steps = Math.max(
      2,
      Math.min(MAX_BEZIER_STEPS, dist / BEZIER_STEP_SIZE)
    );
    for (let i = 1; i <= steps; ++i) {
      const t = i / steps;
      const a = lerp(lerp(p0, p1, t), lerp(p1, p2, t), t);
      const b = lerp(lerp(p1, p2, t), lerp(p2, p, t), t);
      this.points.push(lerp(a, b, t));
    }
  }

  inside(p) {
    let count = 0,
      cur = this.points[this.points.length - 1];
    this.points.forEach((next) => {
      const p0 = cur.y < next.y ? cur : next;
      const p1 = cur.y < next.y ? next : cur;
      if (p0.y < p.y + EPSILON && p1.y > p.y + EPSILON) {
        if ((p1.x - p0.x) * (p.y - p0.y) > (p.x - p0.x) * (p1.y - p0.y)) {
          count += 1;
        }
      }
      cur = next;
    });
    return count % 2 !== 0;
  }
}

export class TextGeometry {
  text: string;
  fontId: string;
  size: number;
  thick: boolean;
  italic: boolean;
  quality: number;
  letterSpacing: number;
  lineHeignt: number;
  align: TextAlign;
  alignVertical: TextAlignVertical;

  font: any;
  vertices: any;
  indicesData: any;
  indices: any;

  needsUpdate: boolean;

  onFontChanged;

  fontSetupTimer: NodeJS.Timeout;

  constructor(
    text?,
    fontId?,
    size?,
    thick?,
    italic?,
    quality?,
    letterSpacing?,
    lineHeignt?,
    align?,
    alignVertical?
  ) {
    this.text = text;
    this.size = size;
    this.thick = thick;
    this.italic = italic;
    this.quality = quality;
    this.letterSpacing = letterSpacing;
    this.lineHeignt = lineHeignt;
    this.align = align;
    this.alignVertical = alignVertical;

    this.needsUpdate = true;

    this.font = FontCache.getInstance().fallbackFont;

    this.requestSetupFont(fontId, FALLBACK_FONT_INTERVAL);
  }

  updateSize(size: number) {
    if (this.size !== size) {
      this.size = size;
      this.needsUpdate = true;
    }
  }

  updateText(text: string) {
    if (this.text !== text) {
      this.text = text;
      this.needsUpdate = true;
    }
  }

  updateLetterSpacing(amount: number) {
    if (this.letterSpacing !== amount) {
      this.letterSpacing = amount;
      this.needsUpdate = true;
    }
  }

  updateLineHeight(amount: number) {
    if (this.lineHeignt !== amount) {
      this.lineHeignt = amount;
      this.needsUpdate = true;
    }
  }

  updateAlign(align: TextAlign) {
    if (this.align !== align) {
      this.align = align;
      this.needsUpdate = true;
    }
  }

  updateAlignVertical(alignVertical: TextAlignVertical) {
    if (this.alignVertical !== alignVertical) {
      this.alignVertical = Object.values(TextAlignVertical)[alignVertical];
      this.needsUpdate = true;
    }
  }

  updateFont(fontUrl: string) {
    if (this.fontId !== fontUrl) {
      this.requestSetupFont(fontUrl);
    }
  }

  getVerticalOffset(height: number): number {
    let offset = 0;
    let scale = (1 / this.font.unitsPerEm) * this.size;

    const heightInPixel = 1024;
    if (this.alignVertical === TextAlignVertical.Center) {
      offset = -(heightInPixel - height * scale) / 2;
    } else if (this.alignVertical === TextAlignVertical.Bottom) {
      offset = -heightInPixel + height * scale;
    }
    return offset;
  }

  async setupFont(fontId: string) {
    let font = await FontCache.getInstance().getFontById(fontId);
    if (font) {
      this.font = font;
      this.needsUpdate = true;
    }

    if (this.onFontChanged) {
      this.onFontChanged();
    }
  }

  async requestSetupFont(fontId: string, interval: number = TIMER_INTERVAL) {
    console.log("font setup");
    // interval for skip duplicated requests
    clearTimeout(this.fontSetupTimer);

    this.fontSetupTimer = setTimeout(() => {
      this.setupFont(fontId);
    }, interval);
  }

  makeFontGeometry() {
    // skip if font is yet loaded
    if (!this.font || !this.needsUpdate) {
      return;
    }
    this.needsUpdate = false;

    // create path layout
    let scale = (1 / this.font.unitsPerEm) * this.size;
    let theta = 1024;

    // Layout some text - notice everything is in em units!
    let result = computeLayout(this.font, this.text, {
      lineHeight: this.lineHeignt * this.font.unitsPerEm, // '2.5em' in font units
      letterSpacing: this.letterSpacing * this.font.unitsPerEm,
      width: theta / scale, // '1024px' in font units
      align: Object.values(TextAlign)[this.align],
    });

    // create a list of closed contours
    const polys = [];

    const verticalOffset = this.getVerticalOffset(result.height);

    result.glyphs.forEach((glyph) => {
      const pos = glyph.position;
      if (glyph.char == `\n`) {
        return;
      }
      glyph.data.path.commands.forEach(({ type, x, y, x1, y1, x2, y2 }) => {
        x = (x + pos[0]) * scale;
        y = (y + pos[1]) * scale + verticalOffset;
        x1 = (x1 + pos[0]) * scale;
        y1 = (y1 + pos[1]) * scale + verticalOffset;
        x2 = (x2 + pos[0]) * scale;
        y2 = (y2 + pos[1]) * scale + verticalOffset;

        switch (type) {
          case "M":
            polys.push(new Polygon());
            polys[polys.length - 1].moveTo({ x, y });
            break;
          case "L":
            polys[polys.length - 1].moveTo({ x, y });
            break;
          case "C":
            polys[polys.length - 1].cubicTo(
              { x, y },
              { x: x1, y: y1 },
              { x: x2, y: y2 }
            );
            break;
          case "Q":
            polys[polys.length - 1].conicTo({ x, y }, { x: x1, y: y1 });
            break;
          case "Z":
            polys[polys.length - 1].close();
            break;
        }
      });
    });

    // sort contours by descending area
    polys.sort((a, b) => Math.abs(b.area) - Math.abs(a.area));

    // classify contours to find holes and their 'parents'
    const root = [];
    for (let i = 0; i < polys.length; ++i) {
      let parent = null;
      for (let j = i - 1; j >= 0; --j) {
        // a contour is a hole if it is inside its parent and has different winding
        if (
          polys[j].inside(polys[i].points[0]) &&
          polys[i].area * polys[j].area < 0
        ) {
          parent = polys[j];
          break;
        }
      }
      if (parent) {
        parent.children.push(polys[i]);
      } else {
        root.push(polys[i]);
      }
    }

    const totalPoints = polys.reduce((sum, p) => sum + p.points.length, 0);
    let vertices = new Float32Array(totalPoints * 2);
    let vertexCount = 0;
    let indices = [];

    let process = function(poly) {
      // construct input for earcut
      const coords = [];
      const holes = [];
      poly.points.forEach(({ x, y }) => coords.push(x, y));
      poly.children.forEach((child) => {
        // children's children are new, separate shapes
        child.children.forEach(process);

        holes.push(coords.length / 2);
        child.points.forEach(({ x, y }) => coords.push(x, y));
      });

      // add vertex data
      vertices.set(coords, vertexCount * 2);
      // add index data
      earcut(coords, holes).forEach((i) => indices.push(i + vertexCount));
      vertexCount += coords.length / 2;
    };
    root.forEach(process);

    this.vertices = vertices;
    this.indicesData = new Uint32Array(indices);
    this.indices = indices;
  }
}
