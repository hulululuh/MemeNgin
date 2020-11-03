import {
  GraphicsItem,
  MouseDownEvent,
  MouseMoveEvent,
  MouseUpEvent,
  MouseOverEvent,
  WidgetEvent,
} from "./graphicsitem";
import { SceneView } from "./view";
import { Rect } from "@/lib/math/rect";
import { Vector2, Matrix3 } from "@math.gl/core";
import { Color } from "../designer/color";
import {
  iCollider,
  CircleCollider,
  LineCollider,
} from "@/lib/math/collision2d";
import { Transform2D } from "@/lib/math/transform2d";
import { runAtThisOrScheduleAtNextAnimationFrame } from "custom-electron-titlebar/lib/common/dom";

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

// https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
export class Transform2dWidget extends GraphicsItem {
  view: SceneView;
  color: Color;
  strokeColor: Color;
  hit: boolean;

  // dragging
  relScale: Vector2;
  dragged: boolean;
  dragStartRelScale: Vector2;
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

    this.relScale = new Vector2(1, 1);
    this.dragged = true;
    this.scaleMode = ScaleMode.None;
    this.dragMode = DragMode.None;

    this.colliders = new Array<iCollider>();
    this.colliders.push(new CircleCollider("cornerTL", 0, radius));
    this.colliders.push(new CircleCollider("cornerTR", 1, radius));
    this.colliders.push(new CircleCollider("cornerBR", 2, radius));
    this.colliders.push(new CircleCollider("cornerBL", 3, radius));
    this.colliders.push(new CircleCollider("rotHandle", 4, radius));
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

    this.transform2d.setRotation(0);
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
    if (!this.visible) {
      return;
    }

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
    if (!this.enable) {
      return;
    }

    this.hit = true;
    this.dragged = false;

    const ptCursor = new Vector2(evt.globalX, evt.globalY);

    let collided;
    const ptsXf = this.ptsTransformed;
    for (let collider of this.colliders) {
      collider.setPts(ptsXf);
      if (collider.isIntersectWith(ptCursor)) {
        collided = collider;
        this.dragStartPos = new Vector2(this.transform2d.position);
        this.distDragStart = new Vector2(ptCursor)
          .sub(this.dragStartPos)
          .magnitude();
        this.sizeOnDragStart = new Vector2(this.transform2d.scale);
        this.dragStartRelScale = new Vector2(this.relScale);
        this.dragStartRotation = this.transform2d.rotation;
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

        this.dragStartPos = new Vector2(this.transform2d.position);
        this.dragStartCursor = new Vector2(ptCursor);

        // set cursor
        this.view.canvas.style.cursor = "grabbing";
      }
    }
  }

  mouseOver(evt: MouseOverEvent) {
    if (!this.enable) {
      return;
    }
    const ptCursor = new Vector2(evt.globalX, evt.globalY);

    for (let collider of this.colliders) {
      const pt = new Vector2(ptCursor).sub(this.transform2d.position);
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
    if (!this.enable) {
      return;
    }
    const ptCursor = new Vector2(evt.globalX, evt.globalY);

    if (this.hit) {
      // movement
      if (this.dragMode == DragMode.Move) {
        const offsetPos = new Vector2(ptCursor).sub(this.dragStartCursor);
        this.transform2d.position = new Vector2(this.dragStartPos).add(
          offsetPos
        );
        this.x = this.transform2d.position[0];
        this.y = this.transform2d.position[1];
      } else if (this.dragMode === DragMode.Rotate) {
        const rotNow = new Vector2(ptCursor)
          .sub(this.transform2d.position)
          .normalize();
        this.transform2d.rotation =
          Math.atan2(rotNow[1], rotNow[0]) + Math.PI / 2;
      } else if (this.dragMode == DragMode.Scale) {
        const distNow = new Vector2(ptCursor)
          .sub(this.dragStartPos)
          .magnitude();
        const relScale = distNow / this.distDragStart;

        let w = this.sizeOnDragStart[0]; // * relScale;
        let h = this.sizeOnDragStart[1]; // * relScale;

        if (this.scaleMode === ScaleMode.XDir) {
          // do not change y scale
          // h = this.sizeOnDragStart[1];
          w *= relScale;
          this.relScale[0] = this.dragStartRelScale[0] * relScale;
        } else if (this.scaleMode === ScaleMode.YDir) {
          // do not change x scale
          // w = this.sizeOnDragStart[0];
          h *= relScale;
          this.relScale[1] = this.dragStartRelScale[1] * relScale;
          //this.dragStartScale[1] *= relScale;
        } else {
          // Both
          w *= relScale;
          h *= relScale;
          this.relScale[0] = this.dragStartRelScale[0] * relScale;
          this.relScale[1] = this.dragStartRelScale[1] * relScale;
          // this.dragStartScale[0] *= relScale;
          // this.dragStartScale[1] *= relScale;
        }

        this.setSize(w, h);
      }

      // send a event to apply result to target
      if (document) {
        const event = new WidgetEvent("widgetDragged", {
          detail: {
            transform2d: new Transform2D(
              this.transform2d.position,
              this.relScale,
              this.transform2d.rotation
            ),

            dragStartRelScale: this.dragStartRelScale,
            relScale: this.relScale,
          },
        });

        document.dispatchEvent(event);
      }

      this.dragged = true;
    }
  }

  get transform(): Matrix3 {
    return this.transform2d.toMatrix();
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
    if (!this.enable) {
      return;
    }
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

  // event handlers
  onWidgetUpdated(evt: WidgetEvent) {
    // this.dragStartRelScale = new Vector2(1, 1);
    // this.relScale = new Vector2(1, 1);

    this.enable = evt.detail.enable;
    this.visible = evt.detail.enable;

    if (!this.enable) return;

    this.dragStartRelScale = new Vector2(evt.detail.dragStartRelScale);
    this.relScale = new Vector2(evt.detail.relScale);
    this.transform2d = evt.detail.transform2d.clone();

    // this.transform2d.setPosition(evt.detail.position);
    // this.transform2d.setScale(evt.detail.scale);
    // this.transform2d.setRotation(evt.detail.rotation);

    this.x = this.transform2d.position[0];
    this.y = this.transform2d.position[1];
    this.width = this.transform2d.scale[0];
    this.height = this.transform2d.scale[1];
  }
}
