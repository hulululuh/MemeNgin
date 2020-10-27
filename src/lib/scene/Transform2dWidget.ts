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

enum XResizeDir {
  None,
  Left,
  Right,
}

enum YResizeDir {
  None,
  Top,
  Bottom,
}

enum DragMode {
  None,
  Move,
  Resize,
  Rotate,
}

export class FrameRegion {
  rect: Rect = null;
  dragMode: DragMode = DragMode.None;
  xResizeDir: XResizeDir = XResizeDir.None;
  yResizeDir: YResizeDir = YResizeDir.None;
  cursor: string = null;
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
    return distance < colMarginLine;
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
  dragged: boolean;
  dragStartPos: Vector2;
  dragStartCenter: Vector2;
  dragStartRect: Rect;

  xResize: XResizeDir;
  yResize: YResizeDir;
  dragMode: DragMode;

  protected colliders: Array<iCollider>;
  protected points: Array<Vector2>;
  protected posRotHandle: Vector2;

  distDragStart: number;
  sizeOnDragStart: Vector2;

  // display properties
  handleSize: number;

  // the radius of the resize handle
  resizeHandleSize: number;

  //
  minSize: number;

  nodes: NodeGraphicsItem[];

  constructor(view: SceneView) {
    super();
    this.view = view;
    this.color = new Color(0.1, 0, 0.2);
    this.strokeColor = new Color(1.0, 1.0, 1.0);
    this.hit = false;
    this.dragged = true;

    this.xResize = XResizeDir.None;
    this.yResize = YResizeDir.None;
    this.dragMode = DragMode.None;

    this.colliders = new Array<iCollider>();
    this.colliders.push(new CircleCollider("corner0", 0));
    this.colliders.push(new CircleCollider("corner1", 1));
    this.colliders.push(new CircleCollider("corner2", 2));
    this.colliders.push(new CircleCollider("corner3", 3));
    this.colliders.push(new CircleCollider("rotHandle", 4));
    this.colliders.push(new LineCollider("edge0", 0, 1));
    this.colliders.push(new LineCollider("edge1", 1, 2));
    this.colliders.push(new LineCollider("edge2", 2, 3));
    this.colliders.push(new LineCollider("edge3", 3, 0));

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

    this.nodes = [];

    this.rotation = 45 * MathUtils.DEG2RAD;
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

  // setFrameRect(rect: Rect) {
  //   this.x = rect.x;
  //   this.y = rect.y;
  //   this.width = rect.width;
  //   this.height = rect.height;
  // }

  draw(ctx: CanvasRenderingContext2D, renderData: any = null) {
    // // outer frame
    // ctx.beginPath();
    // ctx.lineWidth = 1;
    // //ctx.strokeStyle = "rgb(100, 0, 0)";
    // ctx.strokeStyle = this.buildColor(this.color, 1);
    // this.roundRect(ctx, this.x, this.y, this.width, this.height, 1);
    // ctx.stroke();

    // // handle
    let handleSize = this.handleSize;
    // ctx.beginPath();
    // ctx.lineWidth = 1;
    // //ctx.fillStyle = "rgba(100, 0, 0, 0.5)";
    // ctx.fillStyle = this.buildColor(this.color, 0.5);
    // this.roundRect(ctx, this.x, this.y, this.width, handleSize, 1);
    // ctx.fill();

    // ctx.beginPath();
    // ctx.lineWidth = 1;
    // //ctx.strokeStyle = "rgb(100, 0, 0, 0.8)";
    // ctx.strokeStyle = this.buildColor(this.color, 0.8);
    // this.roundRect(ctx, this.x, this.y, this.width, handleSize, 1);
    // ctx.stroke();

    // body
    ctx.beginPath();
    ctx.lineWidth = 1.0;
    //ctx.fillStyle = "rgba(100, 0, 0, 0.2)";
    ctx.fillStyle = this.buildColor(this.color, 0.2);
    ctx.strokeStyle = this.buildColor(this.strokeColor, 1.0);
    ctx.rect(this.x, this.y, this.width, this.height);
    //this.roundRect(ctx, this.x, this.y, this.width, this.height, 1);
    ctx.stroke();

    const xf = this.transform;
    let ptsXf = new Array<Vector2>(this.points.length);
    for (let i = 0; i < this.points.length; i++) {
      const pt = xf.transform(this.points[i]);
      ptsXf[i] = new Vector2().fromArray(pt);
    }

    const ptRotHandleSrc = new Vector2(ptsXf[0]).add(ptsXf[1]).divideScalar(2);
    //const ptRotHandleSrc = new Vector2(ptsXf[0].add(ptsXf[1]).divideScalar(2));
    const ptRotHandleXf = new Vector2(xf.transform(this.posRotHandle));

    // rectangle
    ctx.beginPath();
    const ptBegin = xf.transform(this.points[0]);
    ctx.moveTo(ptBegin[0], ptBegin[1]);
    for (let i = 0; i < this.points.length; i++) {
      let next = (i + 1) % this.points.length;
      //const ptNext = xf.transform(this.points[next]);
      const ptNext = ptsXf[next];
      ctx.lineTo(ptNext[0], ptNext[1]);
    }

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

    // // debug draw frames
    // if (false) {
    //   let regions = this.getFrameRegions();
    //   for (let region of regions) {
    //     let rect = region.rect;
    //     ctx.beginPath();
    //     ctx.lineWidth = 1;
    //     ctx.strokeStyle = "rgb(100, 0, 0, 0.8)";
    //     ctx.rect(rect.x, rect.y, rect.width, rect.height);
    //     ctx.stroke();
    //   }
    // }
  }

  isPointInside(px: number, py: number): boolean {
    let regions = this.getFrameRegions();
    for (let region of regions) {
      if (region.rect.isPointInside(px, py)) {
        return true;
      }
    }

    const xf = this.transform;
    let ptsXf = new Array<Vector2>();
    for (let i = 0; i < this.points.length; i++) {
      ptsXf[i] = new Vector2(xf.transform(this.points[i]));
    }

    const ptXfRotHandle = new Vector2(xf.transform(this.posRotHandle));
    ptsXf.push(ptXfRotHandle);

    for (let collider of this.colliders) {
      collider.setPts(ptsXf);
      if (collider.isIntersectWith(new Vector2(px, py))) {
        return true;
      }
    }

    // top handle
    if (
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.height
    )
      return true;
    return false;
  }

  // MOUSE EVENTS
  mouseDown(evt: MouseDownEvent) {
    this.hit = true;
    this.dragged = false;

    let px = evt.globalX;
    let py = evt.globalY;

    let hitRegion: FrameRegion = null;
    let regions = this.getFrameRegions();
    for (let region of regions) {
      if (region.rect.isPointInside(px, py)) {
        this.dragMode = region.dragMode;
        this.xResize = region.xResizeDir;
        this.yResize = region.yResizeDir;

        this.dragStartRect = this.getRect();
        hitRegion = region;

        this.dragStartCenter = new Vector2(this.centerX(), this.centerY());
        this.distDragStart = new Vector2(px, py)
          .sub(this.dragStartCenter)
          .magnitude();
        this.sizeOnDragStart = new Vector2(this.width, this.height);
        //sizeOnDragStart: Vector2;
        break;
      }
    }

    // drag to move around
    if (hitRegion == null) {
      if (
        px >= this.x &&
        px <= this.x + this.width &&
        py >= this.y &&
        py <= this.y + this.height
      ) {
        this.dragMode = DragMode.Move;
        this.xResize = XResizeDir.None;
        this.yResize = YResizeDir.None;

        this.dragStartPos = new Vector2(this.x, this.y);

        // capture nodes if alt key isnt pressed
        //if (!evt.altKey) this.nodes = this.getHoveredNodes();

        // set cursor
        this.view.canvas.style.cursor = "grabbing";
      }
    }
  }

  mouseOver(evt: MouseOverEvent) {
    let px = evt.globalX;
    let py = evt.globalY;

    let hitRegion: FrameRegion = null;
    let regions = this.getFrameRegions();
    for (let region of regions) {
      if (region.rect.isPointInside(px, py)) {
        this.view.canvas.style.cursor = region.cursor;
        return;
      }
    }

    // drag to move around
    if (hitRegion == null) {
      if (
        px >= this.x &&
        px <= this.x + this.width &&
        py >= this.y &&
        py <= this.y + this.height
      ) {
        this.view.canvas.style.cursor = "grab";
      }
    }
  }

  // // return all scene's nodes in this frame
  // getHoveredNodes(): NodeGraphicsItem[] {
  //   let nodes: NodeGraphicsItem[] = [];
  //   for (let node of this.scene.nodes) {
  //     // node must be entirely inside frame
  //     if (
  //       node.left >= this.left &&
  //       node.right <= this.right &&
  //       node.top >= this.top &&
  //       node.bottom <= this.bottom
  //     ) {
  //       nodes.push(node);
  //     }
  //   }

  //   return nodes;
  // }

  mouseMove(evt: MouseMoveEvent) {
    if (this.hit) {
      // movement
      if (this.dragMode == DragMode.Move) {
        this.move(evt.deltaX, evt.deltaY);

        // move nodes
        for (let node of this.nodes) {
          node.move(evt.deltaX, evt.deltaY);
        }
      }

      const minSize = this.minSize;
      //todo: clamp size
      if (this.dragMode == DragMode.Resize) {
        let px = evt.globalX;
        let py = evt.globalY;

        const distNow = new Vector2(px, py)
          .sub(this.dragStartCenter)
          .magnitude();

        const relScale = distNow / this.distDragStart;
        const w = this.sizeOnDragStart[0] * relScale;
        const h = this.sizeOnDragStart[1] * relScale;

        this.setSize(w, h);

        // new Vector2(px, py).sub(
        //   new Vector2(this.x, this.y)
        // ).length;

        // if (this.xResize == XResizeDir.Left) {
        //   //const minSize = this.resizeHandleSize * 2;
        //   const dtClamped =
        //     this.width - evt.deltaX > minSize
        //       ? evt.deltaX
        //       : this.width - minSize;

        //   this.left += dtClamped;
        //   this.width -= dtClamped;
        // }
        // if (this.xResize == XResizeDir.Right) {
        //   this.width += evt.deltaX;
        // }
        // if (this.yResize == YResizeDir.Top) {
        //   //const minSize = this.resizeHandleSize + this.handleSize;
        //   const dtClamped =
        //     this.height - evt.deltaY > minSize
        //       ? evt.deltaY
        //       : this.height - minSize;

        //   this.top += dtClamped;
        //   this.height -= dtClamped;
        // }
        // if (this.yResize == YResizeDir.Bottom) {
        //   this.height += evt.deltaY;
        // }

        // // clamp
        // const h = Math.max(this.height, this.minSize);
        // const w = Math.max(this.width, this.minSize);
        // this.setSize(w, h);

        // this.width = w;
        // this.height = h;
        // this.scale = new Vector2(this.width, this.height);
      }

      this.dragged = true;
    }
  }

  get transform(): Matrix3 {
    const xf = new Matrix3()
      .translate([this.position[0], this.position[1]])
      .scale([this.scale[0], this.scale[1]])
      .rotate(this.rotation);
    return xf;
  }

  mouseUp(evt: MouseUpEvent) {
    // add undo/redo action
    if (this.dragged) {
      if (this.dragMode == DragMode.Move) {
        let newPos = new Vector2(this.x, this.y);
        let items: GraphicsItem[] = [this];
        let oldPosList: Vector2[] = [this.dragStartPos];
        let newPosList: Vector2[] = [newPos];

        // reverse diff: new pos to old pos
        let diff = new Vector2(
          this.dragStartPos[0] - newPos[0],
          this.dragStartPos[1] - newPos[1]
        );

        // add all captured nodes
        for (let node of this.nodes) {
          items.push(node);
          // new pos is the current pos
          let itemNewPos = new Vector2(node.left, node.top);
          // old pos is current pos plus reverse diff
          let itemOldPos = itemNewPos.clone().add(diff);

          newPosList.push(itemNewPos);
          oldPosList.push(itemOldPos);
        }

        let action = new MoveItemsAction(items, oldPosList, newPosList);
        UndoStack.current.push(action);
      } else if (this.dragMode == DragMode.Resize) {
        // let action = new ResizeFrameAction(
        //   this,
        //   this.dragStartRect.clone(),
        //   this.getRect().clone()
        // );
        // UndoStack.current.push(action);
      }
    }

    this.hit = false;
    this.dragMode = DragMode.None;
    this.nodes = [];

    // reset cursor
    this.view.canvas.style.cursor = "default";
  }

  getFrameRegions(): FrameRegion[] {
    let regions: FrameRegion[] = [];
    let frameRect = this.getRect();
    let rect: Rect = null;
    let region: FrameRegion = null;

    // CORNERS

    // bottom-right
    region = new FrameRegion();
    rect = new Rect();
    rect.x = frameRect.right - this.resizeHandleSize;
    rect.y = frameRect.bottom - this.resizeHandleSize;
    rect.width = this.resizeHandleSize;
    rect.height = this.resizeHandleSize;
    region.rect = rect;
    region.dragMode = DragMode.Resize;
    region.xResizeDir = XResizeDir.Right;
    region.yResizeDir = YResizeDir.Bottom;
    region.cursor = "nwse-resize";
    regions.push(region);

    // bottom-left
    region = new FrameRegion();
    rect = new Rect();
    rect.x = frameRect.left;
    rect.y = frameRect.bottom - this.resizeHandleSize;
    rect.width = this.resizeHandleSize;
    rect.height = this.resizeHandleSize;
    region.rect = rect;
    region.dragMode = DragMode.Resize;
    region.xResizeDir = XResizeDir.Left;
    region.yResizeDir = YResizeDir.Bottom;
    region.cursor = "nesw-resize";
    regions.push(region);

    // top-left
    region = new FrameRegion();
    rect = new Rect();
    rect.x = frameRect.left;
    rect.y = frameRect.top;
    rect.width = this.resizeHandleSize;
    rect.height = this.resizeHandleSize;
    region.rect = rect;
    region.dragMode = DragMode.Resize;
    region.xResizeDir = XResizeDir.Left;
    region.yResizeDir = YResizeDir.Top;
    region.cursor = "nw-resize";
    regions.push(region);

    // top-right
    region = new FrameRegion();
    rect = new Rect();
    rect.x = frameRect.right - this.resizeHandleSize;
    rect.y = frameRect.top;
    rect.width = this.resizeHandleSize;
    rect.height = this.resizeHandleSize;
    region.rect = rect;
    region.dragMode = DragMode.Resize;
    region.xResizeDir = XResizeDir.Right;
    region.yResizeDir = YResizeDir.Top;
    region.cursor = "ne-resize";
    regions.push(region);

    // SIDES

    // left
    region = new FrameRegion();
    rect = new Rect();
    rect.x = frameRect.left;
    rect.y = frameRect.top;
    rect.width = this.resizeHandleSize;
    rect.height = frameRect.height;
    region.rect = rect;
    region.dragMode = DragMode.Resize;
    region.xResizeDir = XResizeDir.Left;
    region.yResizeDir = YResizeDir.None;
    region.cursor = "w-resize";
    regions.push(region);

    // right
    region = new FrameRegion();
    rect = new Rect();
    rect.x = frameRect.right - this.resizeHandleSize;
    rect.y = frameRect.top;
    rect.width = this.resizeHandleSize;
    rect.height = frameRect.height;
    region.rect = rect;
    region.dragMode = DragMode.Resize;
    region.xResizeDir = XResizeDir.Right;
    region.yResizeDir = YResizeDir.None;
    region.cursor = "e-resize";
    regions.push(region);

    // top
    region = new FrameRegion();
    rect = new Rect();
    rect.x = frameRect.left;
    rect.y = frameRect.top;
    rect.width = frameRect.width;
    rect.height = this.resizeHandleSize * 0.5; // top is thinner
    region.rect = rect;
    region.dragMode = DragMode.Resize;
    region.xResizeDir = XResizeDir.None;
    region.yResizeDir = YResizeDir.Top;
    region.cursor = "n-resize";
    regions.push(region);

    // bottom
    region = new FrameRegion();
    rect = new Rect();
    rect.x = frameRect.left;
    rect.y = frameRect.bottom - this.resizeHandleSize;
    rect.width = frameRect.width;
    rect.height = this.resizeHandleSize;
    region.rect = rect;
    region.dragMode = DragMode.Resize;
    region.xResizeDir = XResizeDir.None;
    region.yResizeDir = YResizeDir.Bottom;
    region.cursor = "s-resize";
    regions.push(region);

    // this is handles separately
    // TOPBAR
    // region = new FrameRegion();
    // rect = new Rect();
    // rect.x = frameRect.right - this.resizeHandleSize;
    // rect.y = frameRect.bottom - this.resizeHandleSize;
    // rect.width = this.resizeHandleSize;
    // rect.height = this.resizeHandleSize;
    // region.rect = rect;
    // region.dragMode = DragMode.HandleTop;
    // region.xResizeDir = XResizeDir.None;
    // region.yResizeDir = YResizeDir.None;
    // regions.push(region);

    return regions;
  }
}
