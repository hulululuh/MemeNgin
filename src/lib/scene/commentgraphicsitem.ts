import {
  GraphicsItem,
  MouseDownEvent,
  MouseMoveEvent,
  MouseUpEvent,
} from "./graphicsitem";
import { SceneView } from "./view";
import { Vector2 } from "@math.gl/core";
import { Color } from "../designer/color";
import {
  IPropertyHolder,
  Property,
  StringProperty,
} from "../designer/properties";
import { MoveItemsAction } from "../actions/moveItemsaction";
import { UndoStack } from "../undostack";
import { ApplicationSettings } from "@/settings";
import { TextManager } from "@/assets/textmanager";
const settings = ApplicationSettings.getInstance();

// https://stackoverflow.com/questions/5026961/html5-canvas-ctx-filltext-wont-do-line-breaks
export class CommentGraphicsItem extends GraphicsItem
  implements IPropertyHolder {
  text: string;
  formatted: string;
  textProp: StringProperty;
  view: SceneView;
  color: Color;
  strokeColor: Color;
  textColor: Color;

  padding: number;
  fontHeight: number;

  hit: boolean;
  dragged: boolean;
  dragStartPos: Vector2;

  constructor(view: SceneView) {
    super();
    this.text = "";
    this.view = view;
    this.color = Color.parse(settings.colorInputsFill);
    this.strokeColor = Color.parse(settings.colorInputsStroke);
    this.textColor = Color.parse(settings.colorEditorText);

    this.hit = false;
    this.dragged = false;

    this.padding = 5;
    this.fontHeight = 15;

    this.textProp = new StringProperty("comment", "Comment", "Comment.", true);
    this.properties.push(this.textProp);

    this.setText("comment");
  }

  properties: Property[] = new Array();
  setProperty(name: string, value: any) {
    let prop = this.properties.find((x) => {
      return x.name == name;
    });

    // if (prop) {
    // 	prop.setValue(value);
    // }

    if (name == "comment") {
      this.setText(value.value);
    }
  }

  setText(text: string) {
    this.text = text;
    this.formatted = TextManager.translate(this.text);

    this.textProp.setValue(text);
    let fontHeight = this.fontHeight;

    let ctx = this.view.context;

    ctx.lineWidth = 1;
    ctx.font = fontHeight + "px 'Open Sans'";

    let maxWidth = 0;
    let lines = this.formatted.split("\n");
    // console.log(lines);
    // console.log(ctx);
    // console.log(ctx.font);
    for (let i = 0; i < lines.length; ++i) {
      let size = ctx.measureText(lines[i]);
      //console.log("INITIAL WITH: " + size.width);
      maxWidth = Math.max(maxWidth, size.width);
    }

    let textX = this.x + this.padding;
    let textY = this.y + fontHeight;

    // somewhat inaccurate here for some reason
    // maybe some bug in html5 canvas
    // recalculate in draw function

    this.width = Math.min(maxWidth + this.padding * 2, 800);
    this.height =
      this.measureHeight(
        ctx,
        this.formatted,
        textX,
        textY,
        this.width,
        this.fontHeight
      ) +
      this.padding * 2;
  }

  private buildColor(color: Color, alpha: number) {
    let col =
      "rgba(" +
      color.r * 255 +
      "," +
      color.g * 255 +
      "," +
      color.b * 255 +
      "," +
      alpha +
      ")";

    return col;
  }

  measureHeight(ctx, text, x, y, maxWidth, lineHeight) {
    let words = text.split(" ");
    let line = "";
    let numLines = 1;

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + " ";
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        line = words[n] + " ";
        y += lineHeight;
        numLines++;
      } else {
        line = testLine;
      }
    }
    return lineHeight * numLines;
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    let words = text.split(" ");
    let line = "";

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + " ";
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  draw(ctx: CanvasRenderingContext2D, renderData: any = null) {
    let fontHeight = this.fontHeight;
    ctx.font = fontHeight + "px 'Open Sans'";
    ctx.fillStyle = "rgb(240, 240, 240)";

    // recalc rect
    let maxWidth = 0;
    //console.log(this.text);
    let lines = this.formatted.split("\n");
    for (let i = 0; i < lines.length; ++i) {
      let size = ctx.measureText(lines[i]);
      maxWidth = Math.max(maxWidth, size.width);
    }

    // --------------------------------------------------------
    const width = this.width;
    const height = this.height;

    // stroke bounding rect
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.buildColor(this.strokeColor, 0.7);
    this.roundRect(ctx, this.x, this.y, width, height, 1);
    ctx.stroke();

    // inner area
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.fillStyle = this.buildColor(this.color, 0.1);
    this.roundRect(ctx, this.x, this.y, width, height, 1);
    ctx.fill();

    // multiline text
    ctx.fillStyle = this.buildColor(this.textColor, 1.0);
    let textX = this.x + this.padding;
    let textY = this.y + fontHeight;

    let lineHeight = fontHeight;
    //let lines = this.text.split("\n");
    ctx.font = fontHeight + "px 'Open Sans'";
    ctx.textAlign = "left";
    ctx.lineWidth = 1;

    this.wrapText(
      ctx,
      this.formatted,
      textX,
      textY,
      this.width,
      this.fontHeight
    );
  }

  // MOUSE EVENTS
  mouseDown(evt: MouseDownEvent) {
    this.hit = true;
    this.dragged = false;
    this.dragStartPos = new Vector2(this.x, this.y);
    //console.log(this.text);
  }

  mouseMove(evt: MouseMoveEvent) {
    if (this.hit) {
      // movement
      this.move(evt.deltaX, evt.deltaY);
      this.dragged = true;
    }
  }

  mouseUp(evt: MouseUpEvent) {
    this.hit = false;

    // add undo/redo
    let newPos = new Vector2(this.x, this.y);

    if (this.dragged) {
      let action = new MoveItemsAction(
        [this],
        [this.dragStartPos.clone()],
        [newPos]
      );

      UndoStack.current.push(action);
    }

    this.dragged = false;
  }
}
