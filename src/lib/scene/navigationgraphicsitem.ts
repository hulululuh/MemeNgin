// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { SocketGraphicsItem } from "./socketgraphicsitem";
import {
  GraphicsItem,
  MouseDownEvent,
  MouseMoveEvent,
  MouseUpEvent,
} from "./graphicsitem";
import { Vector2 } from "@math.gl/core";
import { MoveItemsAction } from "../actions/moveItemsaction";
import { UndoStack } from "../undostack";

export class NavigationGraphicsItem extends GraphicsItem {
  id!: string;
  socketA!: SocketGraphicsItem;
  socketB!: SocketGraphicsItem;

  label: string;
  hit: boolean;
  dragged: boolean;
  dragStartPos: Vector2;

  constructor() {
    super();
    this.label = "";

    this.hit = false;
    this.dragged = false;

    this.width = 10;
    this.height = 10;
  }

  setLabel(label: string) {
    this.label = label;
  }

  draw(ctx: CanvasRenderingContext2D, renderData: any = null) {
    ctx.beginPath();
    ctx.strokeStyle = "rgb(200, 200, 200)";
    ctx.lineWidth = 4;
    ctx.arc(this.centerX(), this.centerY(), this.width, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgb(200, 0, 0)";
    ctx.stroke();

    ctx.fillText(this.label, this.x + 5, this.y);
  }

  // MOUSE EVENTS
  mouseDown(evt: MouseDownEvent) {
    this.hit = true;
    this.dragged = false;
    this.dragStartPos = new Vector2(this.x, this.y);
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
