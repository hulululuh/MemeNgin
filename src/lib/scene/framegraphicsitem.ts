import {
  GraphicsItem,
  MouseDownEvent,
  MouseMoveEvent,
  MouseUpEvent,
  MouseOverEvent,
} from "./graphicsitem";
import { SceneView } from "./view";
import { Rect } from "@/lib/math/rect";
import { Vector2 } from "@math.gl/core";
import { Color } from "../designer/color";
import { NodeGraphicsItem } from "./nodegraphicsitem";
import { MoveItemsAction } from "../actions/moveItemsaction";
import { UndoStack } from "../undostack";
import { ResizeFrameAction } from "../actions/resizeframeaction";
import { LogicDesignerNode } from "../designer/logicdesignernode";
import { TextureNode } from "@/lib/library/nodes/texturenode";

const strokeColor = Color.parse("#33333333");
const fillColor = Color.parse("#ffffffff");
const textColor = Color.parse("#000000ff");

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
  HandleTop,
  Resize,
}

export class FrameRegion {
  rect: Rect = null;
  dragMode: DragMode = DragMode.None;
  xResizeDir: XResizeDir = XResizeDir.None;
  yResizeDir: YResizeDir = YResizeDir.None;
  cursor: string = null;
}

// https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
export class FrameGraphicsItem extends GraphicsItem {
  view: SceneView;
  strokeColor: Color;
  fillColor: Color;
  textColor: Color;
  hit: boolean;
  dragged: boolean;
  dragStartPos: Vector2;
  dragStartRect: Rect;

  xResize: XResizeDir;
  yResize: YResizeDir;
  dragMode: DragMode;

  // display properties
  handleSize: number;

  // the radius of the resize handle
  resizeHandleSize: number;

  nodes: NodeGraphicsItem[];

  constructor(view: SceneView) {
    super();
    this.view = view;
    this.strokeColor = strokeColor;
    this.fillColor = fillColor;
    this.textColor = textColor;

    this.hit = false;
    this.dragged = true;

    this.xResize = XResizeDir.None;
    this.yResize = YResizeDir.None;
    this.dragMode = DragMode.None;

    this.handleSize = 30;
    this.resizeHandleSize = 20;

    this.setSize(200, 600);

    this.nodes = [];
  }

  get inputProperties() {
    this.nodes = this.getHoveredNodes();
    let props = [];
    for (let item of this.nodes) {
      if (
        item.dNode instanceof TextureNode ||
        item.dNode instanceof LogicDesignerNode
      ) {
        for (let prop of item.dNode.properties) {
          props.push({ "holder": item.dNode, "prop": prop });
        }
      }
    }
    return props;
  }

  setSize(w: number, h: number) {
    this.width = w;
    this.height = h;
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

  setPos(x: number, y: number) {
    // find diff
    let diff = new Vector2(x - this.x, y - this.y);
    super.setPos(x, y);

    // do a move
    // for (let node of this.nodes) {
    // 	node.move(diff.x, diff.y);
    // }
  }

  setFrameRect(rect: Rect) {
    this.x = rect.x;
    this.y = rect.y;
    this.width = rect.width;
    this.height = rect.height;
  }

  draw(ctx: CanvasRenderingContext2D, renderData: any = null) {
    // outer frame
    ctx.beginPath();
    ctx.lineWidth = 1;
    //ctx.strokeStyle = "rgb(100, 0, 0)";
    ctx.strokeStyle = this.buildColor(this.strokeColor, 1);
    this.roundRect(ctx, this.x, this.y, this.width, this.height, 1);
    ctx.stroke();

    // handle
    let handleSize = this.handleSize;
    ctx.beginPath();
    ctx.lineWidth = 1;
    //ctx.fillStyle = "rgba(100, 0, 0, 0.5)";
    ctx.fillStyle = this.buildColor(this.fillColor, 0.5);
    this.roundRect(ctx, this.x, this.y, this.width, handleSize, 1);
    ctx.fill();

    ctx.beginPath();
    ctx.lineWidth = 1;
    //ctx.strokeStyle = "rgb(100, 0, 0, 0.8)";
    ctx.strokeStyle = this.buildColor(this.strokeColor, 0.8);
    this.roundRect(ctx, this.x, this.y, this.width, handleSize, 1);
    ctx.stroke();

    // body
    ctx.beginPath();
    ctx.lineWidth = 2;
    //ctx.fillStyle = "rgba(100, 0, 0, 0.2)";
    ctx.fillStyle = this.buildColor(this.fillColor, 0.2);
    this.roundRect(
      ctx,
      this.x,
      this.y + handleSize,
      this.width,
      this.height - handleSize,
      1
    );
    ctx.fill();

    // title
    ctx.beginPath();

    const fontSize = 18 * this.view.zoomFactor;

    ctx.save();
    ctx.scale(1.0 / this.view.zoomFactor, 1.0 / this.view.zoomFactor);
    ctx.setTransform(1, 0, 0, 1, this.view.offset.x, this.view.offset.y);

    ctx.font = `${fontSize}px 'Open Sans'`;
    ctx.fillStyle = this.buildColor(this.textColor, 1.0);
    //let size = ctx.measureText(this.textureChannel.toUpperCase());
    let textX = this.x;
    let textY = this.y;

    ctx.fillText(
      "Inputs",
      (textX + 5) * this.view.zoomFactor,
      (textY + 20) * this.view.zoomFactor
    );

    ctx.restore();

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

    // top handle
    if (
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.handleSize
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
        break;
      }
    }

    // topbar
    if (hitRegion == null) {
      if (
        px >= this.x &&
        px <= this.x + this.width &&
        py >= this.y &&
        py <= this.y + this.handleSize
      ) {
        this.dragMode = DragMode.HandleTop;
        this.xResize = XResizeDir.None;
        this.yResize = YResizeDir.None;

        this.dragStartPos = new Vector2(this.x, this.y);

        // capture nodes if alt key isnt pressed
        if (!evt.altKey) this.nodes = this.getHoveredNodes();

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

    // topbar
    if (hitRegion == null) {
      if (
        px >= this.x &&
        px <= this.x + this.width &&
        py >= this.y &&
        py <= this.y + this.handleSize
      ) {
        this.view.canvas.style.cursor = "grab";
      }
    }
  }

  // return all scene's nodes in this frame
  getHoveredNodes(): NodeGraphicsItem[] {
    const isHorizontal = this.getWidth() > this.getHeight();
    let nodes: NodeGraphicsItem[] = [];
    for (let node of this.scene.nodes) {
      // node must be entirely inside frame
      if (
        node.left >= this.left &&
        node.right <= this.right &&
        node.top >= this.top &&
        node.bottom <= this.bottom
      ) {
        nodes.push(node);
      }
    }

    nodes.sort((a, b) => {
      const aPos = a.getPos();
      const bPos = b.getPos();

      if (isHorizontal) {
        return aPos.x - bPos.x;
      } else {
        return aPos.y - bPos.y;
      }
    });

    return nodes;
  }

  mouseMove(evt: MouseMoveEvent) {
    if (this.hit) {
      // movement
      if (this.dragMode == DragMode.HandleTop) {
        this.move(evt.deltaX, evt.deltaY);

        // move nodes
        for (let node of this.nodes) {
          node.move(evt.deltaX, evt.deltaY);
        }
      }

      const minSize = this.resizeHandleSize * 2;
      //todo: clamp size
      if (this.dragMode == DragMode.Resize) {
        if (this.xResize == XResizeDir.Left) {
          const minSize = this.resizeHandleSize * 2;
          const dtClamped =
            this.width - evt.deltaX > minSize
              ? evt.deltaX
              : this.width - minSize;

          this.left += dtClamped;
          this.width -= dtClamped;
        }
        if (this.xResize == XResizeDir.Right) {
          this.width += evt.deltaX;
        }
        if (this.yResize == YResizeDir.Top) {
          const minSize = this.resizeHandleSize + this.handleSize;
          const dtClamped =
            this.height - evt.deltaY > minSize
              ? evt.deltaY
              : this.height - minSize;

          this.top += dtClamped;
          this.height -= dtClamped;
        }
        if (this.yResize == YResizeDir.Bottom) {
          this.height += evt.deltaY;
        }

        // clamp
        this.height = Math.max(
          this.height,
          this.handleSize + this.resizeHandleSize
        );

        this.width = Math.max(this.width, this.resizeHandleSize * 2);
      }

      this.dragged = true;
    }
  }

  mouseUp(evt: MouseUpEvent) {
    // add undo/redo action
    if (this.dragged) {
      if (this.dragMode == DragMode.HandleTop) {
        const dragStartPos = new Vector2(this.dragStartPos);
        let newPos = new Vector2(this.x, this.y);
        let items: GraphicsItem[] = [this];
        let oldPosList: Vector2[] = [dragStartPos];
        let newPosList: Vector2[] = [newPos];

        // reverse diff: new pos to old pos
        let diff = new Vector2(
          dragStartPos.x - newPos.x,
          dragStartPos.y - newPos.y
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
        let action = new ResizeFrameAction(
          this,
          this.dragStartRect.clone(),
          this.getRect().clone()
        );
        UndoStack.current.push(action);
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
