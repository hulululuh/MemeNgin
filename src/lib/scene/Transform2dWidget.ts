import { SocketGraphicsItem } from "./socketgraphicsitem";
import {
  GraphicsItem,
  MouseDownEvent,
  MouseMoveEvent,
  MouseUpEvent,
  MouseOverEvent,
} from "./graphicsitem";
import { SceneView, Rect } from "./view";
import { Vector2, Matrix3 } from "@math.gl/core";
import { Color } from "../designer/color";
import { NodeGraphicsItem } from "./nodegraphicsitem";
import {
  IPropertyHolder,
  Property,
  StringProperty,
  BoolProperty,
} from "../designer/properties";
import { MoveItemsAction } from "../actions/moveItemsaction";
import { UndoStack } from "../undostack";
import { ResizeFrameAction } from "../actions/resizeframeaction";
import { Line, MathUtils, Vector } from "three";
import { runAtThisOrScheduleAtNextAnimationFrame } from "custom-electron-titlebar/lib/common/dom";
import { centerCrop } from "../utils/math";

// collision margin in pixels
const colMarginLine = 10;
const colMarginCircle = 5;
const radius = 5;

enum ScaleMode {
  None,
  XDir,
  YDir,
  Both,
}

enum DragMode {
  None,
  Move,
  Scale,
  Rotate,
}

enum ColliderType {
  None,
  Line,
  Circle,
  Rect,
}

export interface iCollider {
  type: ColliderType;

  // resulting value - cursor
  label: string;

  isIntersectWith(pt: Vector2): boolean;
  getCenter(): Vector2;
  setPts(pts: Array<Vector2>);
}

export class CircleCollider implements iCollider {
  type: ColliderType;
  label: string;
  protected _idx: number;
  protected _pts: Array<Vector2>;

  constructor(label: string, idx: number, pts?: Array<Vector2>) {
    this.type = ColliderType.Circle;
    this.label = label;
    this._idx = idx;
    this._pts = pts;
  }

  isIntersectWith(pt: Vector2): boolean {
    if (!this._pts) {
      console.warn("intersection test without data");
      return;
    }
    const distance = pt.distanceTo(this._pts[this._idx]);
    return distance < colMarginCircle + radius;
  }

  getCenter(): Vector2 {
    return this._pts[this._idx];
  }

  setPts(pts: Array<Vector2>) {
    this._pts = pts;
  }
}

export class LineCollider implements iCollider {
  type: ColliderType;
  label: string;
  protected _idxA: number;
  protected _idxB: number;
  protected _pts: Array<Vector2>;

  constructor(label: string, idxA: number, idxB: number, pts?: Array<Vector2>) {
    this.type = ColliderType.Line;
    this.label = label;
    this._idxA = idxA;
    this._idxB = idxB;
    this._pts = pts;
  }

  isIntersectWith(pt: Vector2): boolean {
    if (!this._pts) {
      console.warn("intersection test without data");
      return;
    }

    const pt1 = this._pts[this._idxA];
    const pt2 = this._pts[this._idxB];

    if (!pt1 || !pt2) {
      return false;
    }

    const dir = new Vector2(pt2).sub(pt1);
    const dir2 = new Vector2(pt).sub(pt1);

    const t = dir2.dot(new Vector2(dir).normalize());
    const closestPt = new Vector2(pt1).add(
      new Vector2(dir).normalize().multiplyByScalar(t)
    );

    const distance = pt.distanceTo(closestPt);
    return distance < colMarginLine && t > 0 && t < dir.len();
  }

  getCenter(): Vector2 {
    const pt1 = this._pts[this._idxA];
    const pt2 = this._pts[this._idxB];
    return new Vector2(pt1).add(pt2).divideScalar(2);
  }

  setPts(pts: Array<Vector2>) {
    this._pts = pts;
  }
}

// https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
export class Transform2dWidget extends GraphicsItem {
  view: SceneView;
  color: Color;
  strokeColor: Color;
  hit: boolean;

  // dragging
  dragged: boolean;
  dragStartCursor: Vector2;
  dragStartPos: Vector2;
  dragStartRect: Rect;
  dragStartRotation: number;

  scaleMode: ScaleMode;
  dragMode: DragMode;

  protected colliders: Array<iCollider>;
  protected points: Array<Vector2>;
  protected posRotHandle: Vector2;
  protected scaleCursorIdx: Array<string>;

  distDragStart: number;
  sizeOnDragStart: Vector2;

  // display properties
  handleSize: number;

  // the radius of the resize handle
  resizeHandleSize: number;

  //
  minSize: number;

  constructor(view: SceneView) {
    super();
    this._drawSelHighlight = false;
    this.view = view;
    this.color = new Color(0.1, 0, 0.2);
    this.strokeColor = new Color(1.0, 1.0, 1.0);
    this.hit = false;
    this.dragged = true;

    this.scaleMode = ScaleMode.None;
    this.dragMode = DragMode.None;

    this.colliders = new Array<iCollider>();
    this.colliders.push(new CircleCollider("cornerTL", 0));
    this.colliders.push(new CircleCollider("cornerTR", 1));
    this.colliders.push(new CircleCollider("cornerBR", 2));
    this.colliders.push(new CircleCollider("cornerBL", 3));
    this.colliders.push(new CircleCollider("rotHandle", 4));
    this.colliders.push(new LineCollider("edgeT", 0, 1));
    this.colliders.push(new LineCollider("edgeR", 1, 2));
    this.colliders.push(new LineCollider("edgeB", 2, 3));
    this.colliders.push(new LineCollider("edgeL", 3, 0));

    this.scaleCursorIdx = [
      "w-resize",
      "nw-resize",
      "s-resize",
      "nesw-resize",
      "e-resize",
      "nwse-resize",
      "n-resize",
      "ne-resize",
    ];

    this.points = new Array<Vector2>(4);
    this.points[0] = new Vector2(-0.5, -0.5);
    this.points[1] = new Vector2(0.5, -0.5);
    this.points[2] = new Vector2(0.5, 0.5);
    this.points[3] = new Vector2(-0.5, 0.5);
    this.posRotHandle = new Vector2(0, -0.75);

    this.handleSize = 30;
    this.resizeHandleSize = 10;
    this.minSize = 2;

    this.setSize(500, 300);

    this.rotation = 0;
    //this.rotation = 22.5 * MathUtils.DEG2RAD;
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
    //console.log(col);
    return col;
  }

  draw(ctx: CanvasRenderingContext2D, renderData: any = null) {
    // body - rectangle
    const xf = this.transform;
    let ptsXf = this.ptsTransformed;

    ctx.lineWidth = 1;
    ctx.strokeStyle = "white";

    ctx.beginPath();
    const ptBegin = ptsXf[0];
    ctx.moveTo(ptBegin[0], ptBegin[1]);
    for (let i = 0; i < this.points.length - 1; i++) {
      let next = (i + 1) % this.points.length;
      const ptNext = ptsXf[next];
      ctx.lineTo(ptNext[0], ptNext[1]);
    }
    ctx.closePath();
    ctx.stroke();

    const ptRotHandleSrc = new Vector2(ptsXf[0]).add(ptsXf[1]).divideScalar(2);
    const ptRotHandleXf = ptsXf[4];
    ctx.beginPath();
    ctx.moveTo(ptRotHandleSrc[0], ptRotHandleSrc[1]);
    ctx.lineTo(ptRotHandleXf[0], ptRotHandleXf[1]);
    ctx.stroke();

    // scaleHandles
    for (const pt of ptsXf) {
      ctx.beginPath();
      ctx.ellipse(pt[0], pt[1], radius, radius, 0, 0, 360);
      ctx.stroke();
    }

    // rotationHandle
    ctx.beginPath();
    ctx.ellipse(ptRotHandleXf[0], ptRotHandleXf[1], radius, radius, 0, 0, 360);
    ctx.stroke();
  }

  isPointInside(px: number, py: number): boolean {
    const xf = this.transform;
    let ptsXf = this.ptsTransformed;
    for (let collider of this.colliders) {
      collider.setPts(ptsXf);
      if (collider.isIntersectWith(new Vector2(px, py))) {
        return true;
      }
    }

    if (this.isPointInsideRect(new Vector2(px, py))) {
      return true;
    }
    return false;
  }

  // MOUSE EVENTS
  mouseDown(evt: MouseDownEvent) {
    this.hit = true;
    this.dragged = false;

    let px = evt.globalX;
    let py = evt.globalY;
    const ptCursor = new Vector2(px, py);

    let collided;
    const ptsXf = this.ptsTransformed;
    for (let collider of this.colliders) {
      collider.setPts(ptsXf);
      if (collider.isIntersectWith(ptCursor)) {
        collided = collider;
        this.dragStartPos = new Vector2(this.position);
        this.distDragStart = new Vector2(px, py)
          .sub(this.dragStartPos)
          .magnitude();
        this.sizeOnDragStart = new Vector2(this.width, this.height);
        this.dragStartRotation = this.rotation;
        this.dragMode =
          collider.label === "rotHandle" ? DragMode.Rotate : DragMode.Scale;

        if (this.dragMode === DragMode.Scale) {
          if (collider.label === "edgeL" || collider.label === "edgeR") {
            this.scaleMode = ScaleMode.XDir;
          } else if (collider.label === "edgeB" || collider.label === "edgeT") {
            this.scaleMode = ScaleMode.YDir;
          } else {
            this.scaleMode = ScaleMode.Both;
          }
        }

        break;
      }
    }

    // drag to move around
    if (!collided) {
      if (this.isPointInsideRect(ptCursor)) {
        this.dragMode = DragMode.Move;

        this.dragStartPos = new Vector2(this.position);
        this.dragStartCursor = new Vector2(ptCursor);

        // set cursor
        this.view.canvas.style.cursor = "grabbing";
      }
    }
  }

  mouseOver(evt: MouseOverEvent) {
    let px = evt.globalX;
    let py = evt.globalY;

    const ptCursor = new Vector2(px, py);

    for (let collider of this.colliders) {
      const pt = new Vector2(ptCursor).sub(this.position);
      if (collider.isIntersectWith(ptCursor)) {
        if (collider.label === "rotHandle") {
          this.view.canvas.style.cursor = "grab";
        } else {
          this.view.canvas.style.cursor = this.getResizeCursor(pt);
        }
        return;
      }
    }

    // drag to move around
    if (this.isPointInsideRect(ptCursor)) {
      this.view.canvas.style.cursor = "grab";
    }
  }

  mouseMove(evt: MouseMoveEvent) {
    const ptCursor = new Vector2(evt.globalX, evt.globalY);

    if (this.hit) {
      // movement
      if (this.dragMode == DragMode.Move) {
        const offsetPos = new Vector2(ptCursor).sub(this.dragStartCursor);
        this.position = new Vector2(this.dragStartPos).add(offsetPos);
        this.x = this.position[0];
        this.y = this.position[1];
      } else if (this.dragMode === DragMode.Rotate) {
        const rotNow = new Vector2(ptCursor).sub(this.position).normalize();
        this.rotation = Math.atan2(rotNow[1], rotNow[0]) + Math.PI / 2;
      } else if (this.dragMode == DragMode.Scale) {
        const distNow = new Vector2(ptCursor)
          .sub(this.dragStartPos)
          .magnitude();
        const relScale = distNow / this.distDragStart;

        let w = this.sizeOnDragStart[0] * relScale;
        let h = this.sizeOnDragStart[1] * relScale;

        if (this.scaleMode === ScaleMode.XDir) {
          // do not change y scale
          h = this.sizeOnDragStart[1];
        } else if (this.scaleMode === ScaleMode.YDir) {
          // do not change x scale
          w = this.sizeOnDragStart[0];
        }

        this.setSize(w, h);
      }

      this.dragged = true;
    }
  }

  get transform(): Matrix3 {
    const xf = new Matrix3()
      .translate([this.position[0], this.position[1]])
      .rotate(this.rotation)
      .scale([this.scale[0], this.scale[1]]);
    return xf;
  }

  get ptsTransformed(): Array<Vector2> {
    const xf = this.transform;

    let ptsXf = new Array<Vector2>();
    for (let i = 0; i < this.points.length; i++) {
      const pt = xf.transform(this.points[i]);
      ptsXf[i] = new Vector2(pt);
    }

    const ptXfRotHandle = new Vector2(xf.transform(this.posRotHandle));
    ptsXf.push(ptXfRotHandle);

    return ptsXf;
  }

  getRect(): Rect {
    const ptsXf = this.ptsTransformed;
    const min = new Vector2(ptsXf[0]);
    const max = new Vector2(ptsXf[2]);

    for (let pt of ptsXf) {
      min[0] = Math.min(min[0], pt[0]);
      min[1] = Math.min(min[1], pt[1]);
      max[0] = Math.max(max[0], pt[0]);
      max[1] = Math.max(max[1], pt[1]);
    }

    let rect = new Rect();
    rect.x = min[0];
    rect.y = min[1];
    rect.width = max[0] - min[0];
    rect.height = max[1] - min[1];

    return rect;
  }

  isPointInsideRect(ptTransformed: Vector2): boolean {
    let matInverse = new Matrix3(this.transform).invert();
    const ptOrigin = matInverse.transform(
      new Vector2(ptTransformed[0], ptTransformed[1])
    );

    if (
      ptOrigin[0] >= this.points[0][0] &&
      ptOrigin[0] <= this.points[2][0] &&
      ptOrigin[1] >= this.points[0][1] &&
      ptOrigin[1] <= this.points[2][1]
    ) {
      return true;
    }
    return false;
  }

  mouseUp(evt: MouseUpEvent) {
    // // add undo/redo action
    // if (this.dragged) {
    //   if (this.dragMode == DragMode.Move) {
    //     // let newPos = new Vector2(this.x, this.y);
    //     // let items: GraphicsItem[] = [this];
    //     // let oldPosList: Vector2[] = [this.dragStartPos];
    //     // let newPosList: Vector2[] = [newPos];
    //     // // reverse diff: new pos to old pos
    //     // let diff = new Vector2(
    //     //   this.dragStartPos[0] - newPos[0],
    //     //   this.dragStartPos[1] - newPos[1]
    //     // );
    //     // let action = new MoveItemsAction(items, oldPosList, newPosList);
    //     // UndoStack.current.push(action);
    //   } else if (this.dragMode == DragMode.Rotate) {
    //   } else if (this.dragMode == DragMode.Scale) {
    //     // let action = new ResizeFrameAction(
    //     //   this,
    //     //   this.dragStartRect.clone(),
    //     //   this.getRect().clone()
    //     // );
    //     // UndoStack.current.push(action);
    //   }
    // }

    this.hit = false;
    this.scaleMode = ScaleMode.None;
    this.dragMode = DragMode.None;

    // reset cursor
    this.view.canvas.style.cursor = "default";
  }

  getResizeCursor(dir: Vector2): string {
    dir.normalize();

    const rotMat = new Matrix3();
    rotMat.rotate(-Math.PI / 8);
    rotMat.transform(dir);

    let idx = ((Math.atan2(dir.y, dir.x) + Math.PI) * 8) / (Math.PI * 2);
    return this.scaleCursorIdx[idx.toFixed()];
  }
}
