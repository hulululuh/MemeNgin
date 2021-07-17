// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { iWidget } from "./widget";
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

enum DragMode_Quad {
  None,
  MoveAll,
  MoveTL,
  MoveTR,
  MoveBL,
  MoveBR,
  MoveT,
  MoveB,
  MoveL,
  MoveR,
  Rotate,
}

// mapping table
const DRAG_MODE = new Map<string, DragMode_Quad>([
  ["cornerTL", DragMode_Quad.MoveTL],
  ["cornerTR", DragMode_Quad.MoveTR],
  ["cornerBL", DragMode_Quad.MoveBL],
  ["cornerBR", DragMode_Quad.MoveBR],
  ["edgeT", DragMode_Quad.MoveT],
  ["edgeB", DragMode_Quad.MoveB],
  ["edgeL", DragMode_Quad.MoveL],
  ["edgeR", DragMode_Quad.MoveR],
]);

const DRAG_INDICES = new Map<DragMode_Quad, Array<number>>([
  [DragMode_Quad.MoveAll, [0, 1, 2, 3]],
  [DragMode_Quad.MoveTL, [0]],
  [DragMode_Quad.MoveTR, [1]],
  [DragMode_Quad.MoveBR, [2]],
  [DragMode_Quad.MoveBL, [3]],
  [DragMode_Quad.MoveT, [0, 1]],
  [DragMode_Quad.MoveR, [1, 2]],
  [DragMode_Quad.MoveB, [2, 3]],
  [DragMode_Quad.MoveL, [3, 0]],
  [DragMode_Quad.Rotate, [0, 1, 2, 3]],
]);

enum HighlightMode_Quad {
  None = "None",
  CornerTL = "cornerTL",
  CornerTR = "cornerTR",
  CornerBL = "cornerBL",
  CornerBR = "cornerBR",
  EdgeT = "edgeT",
  EdgeB = "edgeB",
  EdgeL = "edgeL",
  EdgeR = "edgeR",
  Rotation = "rotation",
  MoveAll = "moveAll",
}

// mapping table
const HIGHLIGHT_MODE = new Map<string, HighlightMode_Quad>([
  ["cornerTL", HighlightMode_Quad.CornerTL],
  ["cornerTR", HighlightMode_Quad.CornerTR],
  ["cornerBL", HighlightMode_Quad.CornerBL],
  ["cornerBR", HighlightMode_Quad.CornerBR],
  ["edgeT", HighlightMode_Quad.EdgeT],
  ["edgeB", HighlightMode_Quad.EdgeB],
  ["edgeL", HighlightMode_Quad.EdgeL],
  ["edgeR", HighlightMode_Quad.EdgeR],
]);

const HIGHLIGHT_EDGE_INDICES = new Map<HighlightMode_Quad, Array<number>>([
  [HighlightMode_Quad.MoveAll, [0, 1, 2, 3]],
  [HighlightMode_Quad.EdgeT, [0]],
  [HighlightMode_Quad.EdgeR, [1]],
  [HighlightMode_Quad.EdgeB, [2]],
  [HighlightMode_Quad.EdgeL, [3]],
  [HighlightMode_Quad.None, []],
]);

// https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
export class TransformQuadWidget extends GraphicsItem implements iWidget {
  // iWidget
  member: string;

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

  dragMode: DragMode_Quad;
  highlightMode: HighlightMode_Quad;

  protected colliders: Array<iCollider>;
  protected points: Array<Vector2>;
  protected ptCenter: Vector2;
  protected posRotHandle: Vector2;
  protected scaleCursorIdx: Array<string>;

  protected ptsDragStarted: Array<Vector2>;
  protected offsetOnDragging: Array<Vector2>;

  protected rotDragStart: number;
  protected rotOffset: number;

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
    this.dragMode = DragMode_Quad.None;
    this.highlightMode = HighlightMode_Quad.None;

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

    this.ptCenter = new Vector2(0, 0);

    this.handleSize = 30;
    this.resizeHandleSize = 10;
    this.minSize = 2;

    this.setSize(500, 300);
    this.transform2d.setRotation(0);
  }

  isEnabled(): boolean {
    return this.enable;
  }

  setEnable(enable: boolean) {
    this.enable = enable;
  }

  draw(ctx: CanvasRenderingContext2D, renderData: any = null) {
    if (!this.enable) {
      return;
    }

    const drawWidget = function(
      item: TransformQuadWidget,
      drawHighlight: boolean = false
    ) {
      if (drawHighlight && item.highlightMode === HighlightMode_Quad.None)
        return;

      let drawCornerCircle = true;
      let drawCircleIndices = [0, 1, 2, 3];
      let drawRotation = true;
      if (drawHighlight) {
        const m = item.highlightMode;
        drawCornerCircle =
          m == HighlightMode_Quad.CornerBL ||
          m == HighlightMode_Quad.CornerBR ||
          m == HighlightMode_Quad.CornerTL ||
          m == HighlightMode_Quad.CornerTR;

        if (drawCornerCircle) {
          drawCircleIndices = [];
          if (m == HighlightMode_Quad.CornerTL) drawCircleIndices = [0];
          if (m == HighlightMode_Quad.CornerTR) drawCircleIndices = [1];
          if (m == HighlightMode_Quad.CornerBR) drawCircleIndices = [2];
          if (m == HighlightMode_Quad.CornerBL) drawCircleIndices = [3];
        }
        drawRotation = item.highlightMode == HighlightMode_Quad.Rotation;
      }

      let ptsXf = item.ptsTransformed;

      // body - edges
      if (drawHighlight) {
        const indices = HIGHLIGHT_EDGE_INDICES.get(item.highlightMode);
        if (indices) {
          for (const idx of indices) {
            const idxStart = idx;
            const idxEnd = (idx + 1) % item.points.length;

            ctx.beginPath();
            const ptBegin = ptsXf[idxStart];
            ctx.moveTo(ptBegin[0], ptBegin[1]);
            const ptNext = ptsXf[idxEnd];
            ctx.lineTo(ptNext[0], ptNext[1]);
            ctx.stroke();
          }
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

      // scaleHandles
      //for (const pt of ptsXf) {

      if (drawCornerCircle) {
        for (let idx of drawCircleIndices) {
          const pt = ptsXf[idx];
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
        // for (let i = 0; i < ptsXf.length - 1; i++) {
        //   const pt = ptsXf[i];
        //   ctx.beginPath();
        //   ctx.ellipse(
        //     pt[0],
        //     pt[1],
        //     settings.widgetRadius / item.view.zoomFactor,
        //     settings.widgetRadius / item.view.zoomFactor,
        //     0,
        //     0,
        //     360
        //   );
        //   ctx.stroke();
        // }
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
    const hovered = hoverResult[1] != HighlightMode_Quad.None;
    if (hovered) return true;
    else this.highlightMode = HighlightMode_Quad.None;

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

  hover(evt: MouseOverEvent): [DragMode_Quad, HighlightMode_Quad] {
    let dragMode: DragMode_Quad = DragMode_Quad.None;
    let highlightMode: HighlightMode_Quad = HighlightMode_Quad.None;

    const ptCursor = new Vector2(evt.globalX, evt.globalY);
    const ptsXf = this.ptsTransformed;
    let collided;
    for (let collider of this.colliders) {
      collider.setPts(ptsXf);
      if (collider.isIntersectWith(ptCursor, this.view.zoomFactor)) {
        collided = collider;
        dragMode =
          collider.label === "rotHandle"
            ? DragMode_Quad.Rotate
            : DragMode_Quad.MoveAll;

        if (collider.label === "rotHandle") {
          highlightMode = HighlightMode_Quad.Rotation;
        } else {
          let highlight = HIGHLIGHT_MODE.get(collider.label);
          if (highlight) {
            highlightMode = highlight;
          }
        }

        break;
      }
    }

    if (!collided) {
      if (this.isPointInsideRect(ptCursor)) {
        highlightMode = HighlightMode_Quad.MoveAll;
      }
    }

    return [dragMode, highlightMode];
  }

  // MOUSE EVENTS
  mouseDown(evt: MouseDownEvent) {
    if (!this.enable) {
      return;
    }

    this.hit = true;
    this.dragged = false;

    const ptCursor = new Vector2(evt.globalX, evt.globalY);
    this.dragStartCursor = new Vector2(ptCursor);

    let collided;
    const ptsXf = this.ptsTransformed;
    for (let collider of this.colliders) {
      collider.setPts(ptsXf);

      this.ptsDragStarted = [];
      this.offsetOnDragging = [];
      for (const pt of this.points) {
        this.ptsDragStarted.push(new Vector2(pt[0], pt[1]));
        this.offsetOnDragging.push(new Vector2(0, 0));
      }
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
          collider.label === "rotHandle"
            ? DragMode_Quad.Rotate
            : DragMode_Quad.MoveAll;

        if (collider.label === "rotHandle") {
          this.highlightMode = HighlightMode_Quad.Rotation;

          // rotation
          //const xf = this.transform.invert();
          const xf = this.transform;
          const v = new Vector2(ptCursor).sub(xf.transform(this.ptCenter));

          this.rotDragStart = Math.atan2(v[1], v[0]);
        } else {
          const dragMode = DRAG_MODE.get(collider.label);
          if (dragMode) this.dragMode = dragMode;
        }

        break;
      }
    }

    // drag to move around
    if (!collided) {
      if (this.isPointInsideRect(ptCursor)) {
        this.dragMode = DragMode_Quad.MoveAll;
        this.highlightMode = HighlightMode_Quad.MoveAll;

        this.dragStartPos = new Vector2(this.transform2d.position);
        //this.dragStartCursor = new Vector2(ptCursor);

        // set cursor
        this.view.canvas.style.cursor = "grabbing";
      }
    }

    // catch the first frame of valid transform
    if (this.dragMode != DragMode_Quad.None) {
      // send a event to focus event to property
      if (document) {
        const event = new WidgetEvent("widgetDragStarted", {});
        document.dispatchEvent(event);
      }
    }
  }

  mouseOver(evt: MouseOverEvent) {
    if (!this.enable) {
      return;
    }

    if (this.dragMode == DragMode_Quad.None) {
      // hovering - update highlight mode
      const hoverResult = this.hover(evt);
      this.highlightMode = hoverResult[1];
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

    let isMoving = false;
    const ptCursor = new Vector2(evt.globalX, evt.globalY);

    if (this.hit) {
      let targets = DRAG_INDICES.get(this.dragMode);

      // something have hovered
      const offsetPos = new Vector2(ptCursor)
        .sub(this.dragStartCursor)
        .add(new Vector2(this.x, this.y));

      // movement
      if (this.dragMode === DragMode_Quad.None) {
        // do nothing
      } else if (this.dragMode === DragMode_Quad.Rotate) {
        // rotation
        //const xf = this.transform.invert();
        const xf = this.transform;
        const v = new Vector2(ptCursor).sub(xf.transform(this.ptCenter));

        let rotDelta = Math.atan2(v[1], v[0]) - this.rotDragStart;

        let rotXf = new Transform2D(
          new Vector2(0, 0),
          new Vector2(1, 1),
          rotDelta
        ).toMatrix();

        if (targets && targets.length > 0) {
          for (const [i, v] of this.ptsDragStarted.entries()) {
            const found = targets.find((item) => item == i);
            if (found != undefined) {
              this.points[i] = new Vector2(
                rotXf.transform(new Vector2(v).sub(this.ptCenter))
              ).add(this.ptCenter);
            }
          }
        }

        // const rotNow = new Vector2(ptCursor)
        //   .sub(this.transform2d.position)
        //   .normalize();
        // this.transform2d.rotation =
        //   Math.atan2(rotNow[1], rotNow[0]) + Math.PI / 2;
      } else if (this.dragMode == DragMode_Quad.MoveAll) {
        isMoving = true;
        // something have hovered
        for (const [i, v] of this.ptsDragStarted.entries()) {
          //const offsetPos = new Vector2(ptCursor).sub(v);
          const found = targets.find((item) => item == i);
          if (found != undefined) {
            this.offsetOnDragging[i] = new Vector2(offsetPos);
          }
        }
      } else {
        if (targets && targets.length > 0) {
          isMoving = true;
          for (const [i, v] of this.ptsDragStarted.entries()) {
            //const offsetPos = new Vector2(ptCursor).sub(v);
            const found = targets.find((item) => item == i);
            if (found != undefined) {
              this.offsetOnDragging[i] = new Vector2(offsetPos);
            }
          }
        }
      }

      if (isMoving) {
        if (targets && targets.length > 0) {
          // something have hovered
          for (const [i, v] of this.ptsDragStarted.entries()) {
            const found = targets.find((item) => item == i);
            if (found != undefined) {
              //const xf = this.transform.invert();
              const xf = this.transform.invert();
              let ptOffset = xf.transform(
                new Vector2(this.offsetOnDragging[i])
              );
              let ptXf = new Vector2(ptOffset).add(this.ptsDragStarted[i]);
              this.points[i] = new Vector2(ptXf[0], ptXf[1]);
            }
          }
        }
      }

      let cB = new Vector2(this.points[2]).add(this.points[3]).divideScalar(2);
      let cT = new Vector2(this.points[0]).add(this.points[1]).divideScalar(2);
      this.posRotHandle = new Vector2(cT).add(
        new Vector2(cT).sub(cB).multiplyByScalar(0.25)
      );

      if (isMoving) {
        this.ptCenter = new Vector2(cB).add(cT).divideScalar(2);
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
            points: this.points,
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
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

    let matInverse = new Matrix3(this.transform).invert();

    const ptOrigin = matInverse.transform(
      new Vector2(ptTransformed[0], ptTransformed[1])
    );
    let x = ptOrigin[0];
    let y = ptOrigin[1];

    const pts = this.points;
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      let xi = pts[i][0],
        yi = pts[i][1];
      let xj = pts[j][0],
        yj = pts[j][1];

      let intersect =
        yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
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

    if (this.dragged) {
      // send a event to blur event to property
      if (document) {
        const event = new WidgetEvent("widgetDragEnded", {});
        document.dispatchEvent(event);
      }
    }

    this.dragged = false;
    this.hit = false;
    this.dragMode = DragMode_Quad.None;

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

    if (!this.enable) return;
    if (!evt.detail.transform2d) return;

    this.dragStartRelScale = new Vector2(evt.detail.dragStartRelScale);
    this.relScale = new Vector2(evt.detail.relScale);
    this.transform2d = evt.detail.transform2d.clone();

    this.x = this.transform2d.position[0];
    this.y = this.transform2d.position[1];
    this.width = this.transform2d.scale[0];
    this.height = this.transform2d.scale[1];

    for (let i = 0; i < evt.detail.points.length; i++) {
      this.points[i] = new Vector2(evt.detail.points[i]);
    }

    let cB = new Vector2(this.points[2]).add(this.points[3]).divideScalar(2);
    let cT = new Vector2(this.points[0]).add(this.points[1]).divideScalar(2);
    this.posRotHandle = new Vector2(cT).add(
      new Vector2(cT).sub(cB).multiplyByScalar(0.25)
    );

    this.ptCenter = new Vector2(cB).add(cT).divideScalar(2);
  }
}
