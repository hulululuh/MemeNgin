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
import { ApplicationSettings } from "@/settings";
import { Vector2, Matrix3 } from "@math.gl/core";
import {
  iCollider,
  CircleCollider,
  LineCollider,
} from "@/lib/math/collision2d";
import { Transform2D } from "@/lib/math/transform2d";

const settings = ApplicationSettings.getInstance();

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

enum HighlightMode {
  None,
  ScaleX,
  ScaleY,
  ScaleCircle,
  Rotation,
  Move,
}

// https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
export class Transform2dWidget extends GraphicsItem {
  view: SceneView;
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
  highlightMode: HighlightMode;

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
    this.hit = false;

    this.relScale = new Vector2(1, 1);
    this.dragged = true;
    this.scaleMode = ScaleMode.None;
    this.dragMode = DragMode.None;
    this.highlightMode = HighlightMode.None;

    this.colliders = new Array<iCollider>();
    this.colliders.push(
      new CircleCollider("cornerTL", 0, settings.widgetRadius)
    );
    this.colliders.push(
      new CircleCollider("cornerTR", 1, settings.widgetRadius)
    );
    this.colliders.push(
      new CircleCollider("cornerBR", 2, settings.widgetRadius)
    );
    this.colliders.push(
      new CircleCollider("cornerBL", 3, settings.widgetRadius)
    );
    this.colliders.push(
      new CircleCollider("rotHandle", 4, settings.widgetRadius)
    );
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

  draw(ctx: CanvasRenderingContext2D, renderData: any = null) {
    if (!this.visible) {
      return;
    }

    const drawWidget = function(
      item: Transform2dWidget,
      drawHighlight: boolean = false
    ) {
      if (drawHighlight && item.highlightMode === HighlightMode.None) return;

      let drawScaleX = true;
      let drawScaleY = true;
      let drawScaleCircle = true;
      let drawRotation = true;
      if (drawHighlight) {
        drawScaleX = item.highlightMode == HighlightMode.ScaleX;
        drawScaleY = item.highlightMode == HighlightMode.ScaleY;
        drawScaleCircle = item.highlightMode == HighlightMode.ScaleCircle;
        drawRotation = item.highlightMode == HighlightMode.Rotation;
      }

      let ptsXf = item.ptsTransformed;
      // body
      if (drawHighlight) {
        for (let i = 0; i < item.points.length; i++) {
          const axisX = i % 2 === 1;
          const shouldDraw =
            item.highlightMode == HighlightMode.Move ||
            (axisX && drawScaleX) ||
            (!axisX && drawScaleY);

          if (!shouldDraw) continue;

          ctx.beginPath();
          const ptBegin = ptsXf[i];
          ctx.moveTo(ptBegin[0], ptBegin[1]);
          let next = (i + 1) % item.points.length;
          const ptNext = ptsXf[next];
          ctx.lineTo(ptNext[0], ptNext[1]);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        const ptBegin = ptsXf[0];
        ctx.moveTo(ptBegin[0], ptBegin[1]);
        for (let i = 0; i < item.points.length - 1; i++) {
          let next = (i + 1) % item.points.length;
          const ptNext = ptsXf[next];
          ctx.lineTo(ptNext[0], ptNext[1]);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // rotation handle
      if (drawRotation) {
        // bar
        const ptRotHandleSrc = new Vector2(ptsXf[0])
          .add(ptsXf[1])
          .divideScalar(2);
        const ptRotHandleXf = ptsXf[4];
        ctx.beginPath();
        ctx.moveTo(ptRotHandleSrc[0], ptRotHandleSrc[1]);
        ctx.lineTo(ptRotHandleXf[0], ptRotHandleXf[1]);
        ctx.stroke();

        // circle(handle)
        ctx.beginPath();
        ctx.ellipse(
          ptRotHandleXf[0],
          ptRotHandleXf[1],
          settings.widgetRadius / item.view.zoomFactor,
          settings.widgetRadius / item.view.zoomFactor,
          0,
          0,
          360
        );
        ctx.stroke();
      }

      if (drawScaleCircle) {
        // scaleHandles
        //for (const pt of ptsXf) {
        for (let i = 0; i < ptsXf.length - 1; i++) {
          const pt = ptsXf[i];
          ctx.beginPath();
          ctx.ellipse(
            pt[0],
            pt[1],
            settings.widgetRadius / item.view.zoomFactor,
            settings.widgetRadius / item.view.zoomFactor,
            0,
            0,
            360
          );
          ctx.stroke();
        }
      }
    };

    // draw shadow
    ctx.lineWidth =
      (settings.widgetThickness + settings.widgetShadowThickness) /
      this.view.zoomFactor;
    ctx.strokeStyle = settings.colorWidgetShadow;
    drawWidget(this);

    // draw body
    ctx.lineWidth = settings.widgetThickness / this.view.zoomFactor;
    ctx.strokeStyle = settings.colorWidget;
    drawWidget(this);

    // draw highlights
    ctx.lineWidth = settings.widgetThickness / this.view.zoomFactor;
    ctx.strokeStyle = settings.colorWidgetHighlight;
    drawWidget(this, true);
  }

  isPointInside(px: number, py: number): boolean {
    let mouseEvent = new MouseOverEvent();
    mouseEvent.globalX = px;
    mouseEvent.globalY = py;
    const hoverResult = this.hover(mouseEvent);
    const hovered = hoverResult[2] != HighlightMode.None;
    if (hovered) return true;
    else this.highlightMode = HighlightMode.None;

    // const xf = this.transform;
    // let ptsXf = this.ptsTransformed;
    // for (let collider of this.colliders) {
    //   collider.setPts(ptsXf);
    //   if (collider.isIntersectWith(new Vector2(px, py), this.view.zoomFactor)) {
    //     return true;
    //   }
    // }

    if (this.isPointInsideRect(new Vector2(px, py))) {
      return true;
    }
    return false;
  }

  hover(evt: MouseOverEvent): [DragMode, ScaleMode, HighlightMode] {
    let dragMode: DragMode = DragMode.None;
    let scaleMode: ScaleMode = ScaleMode.None;
    let highlightMode: HighlightMode = HighlightMode.None;

    const ptCursor = new Vector2(evt.globalX, evt.globalY);
    const ptsXf = this.ptsTransformed;
    let collided;
    for (let collider of this.colliders) {
      collider.setPts(ptsXf);
      if (collider.isIntersectWith(ptCursor, this.view.zoomFactor)) {
        collided = collider;
        dragMode =
          collider.label === "rotHandle" ? DragMode.Rotate : DragMode.Scale;

        if (collider.label === "rotHandle") {
          highlightMode = HighlightMode.Rotation;
        }

        if (dragMode === DragMode.Scale) {
          if (collider.label === "edgeL" || collider.label === "edgeR") {
            scaleMode = ScaleMode.XDir;
            highlightMode = HighlightMode.ScaleX;
          } else if (collider.label === "edgeB" || collider.label === "edgeT") {
            scaleMode = ScaleMode.YDir;
            highlightMode = HighlightMode.ScaleY;
          } else {
            scaleMode = ScaleMode.Both;
            highlightMode = HighlightMode.ScaleCircle;
          }
        }

        break;
      }
    }

    if (!collided) {
      if (this.isPointInsideRect(ptCursor)) {
        highlightMode = HighlightMode.Move;
      }
    }

    return [dragMode, scaleMode, highlightMode];
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
      if (collider.isIntersectWith(ptCursor, this.view.zoomFactor)) {
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

        if (collider.label === "rotHandle") {
          this.highlightMode = HighlightMode.Rotation;
        }

        if (this.dragMode === DragMode.Scale) {
          if (collider.label === "edgeL" || collider.label === "edgeR") {
            this.scaleMode = ScaleMode.XDir;
            this.highlightMode = HighlightMode.ScaleX;
          } else if (collider.label === "edgeB" || collider.label === "edgeT") {
            this.scaleMode = ScaleMode.YDir;
            this.highlightMode = HighlightMode.ScaleY;
          } else {
            this.scaleMode = ScaleMode.Both;
            this.highlightMode = HighlightMode.ScaleCircle;
          }
        }

        break;
      }
    }

    // drag to move around
    if (!collided) {
      if (this.isPointInsideRect(ptCursor)) {
        this.dragMode = DragMode.Move;
        this.highlightMode = HighlightMode.Move;

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

    if (this.dragMode == DragMode.None) {
      // hovering - update highlight mode
      const hoverResult = this.hover(evt);
      this.highlightMode = hoverResult[2];
    }

    const ptCursor = new Vector2(evt.globalX, evt.globalY);
    for (let collider of this.colliders) {
      const pt = new Vector2(ptCursor).sub(this.transform2d.position);
      if (collider.isIntersectWith(ptCursor, this.view.zoomFactor)) {
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
    this.enable = evt.detail.enable;
    this.visible = evt.detail.enable;

    if (!this.enable) return;
    if (!evt.detail.transform2d) return;

    this.dragStartRelScale = new Vector2(evt.detail.dragStartRelScale);
    this.relScale = new Vector2(evt.detail.relScale);
    this.transform2d = evt.detail.transform2d.clone();

    this.x = this.transform2d.position[0];
    this.y = this.transform2d.position[1];
    this.width = this.transform2d.scale[0];
    this.height = this.transform2d.scale[1];
  }
}
