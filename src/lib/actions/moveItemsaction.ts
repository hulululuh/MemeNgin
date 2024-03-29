// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { Action } from "../undostack";
import { GraphicsItem } from "../scene/graphicsitem";
import { Vector2 } from "@math.gl/core";

export class MoveItemsAction extends Action {
  items: GraphicsItem[];
  oldPosList: Vector2[];
  newPosList: Vector2[];

  constructor(
    items: GraphicsItem[],
    oldPosList: Vector2[],
    newPosList: Vector2[]
  ) {
    super();

    this.items = items;
    this.oldPosList = oldPosList;
    this.newPosList = newPosList;
  }

  undo() {
    for (let i = 0; i < this.items.length; i++) {
      let pos = this.oldPosList[i];
      this.items[i].setPos(pos[0], pos[1]);
    }
  }

  redo() {
    for (let i = 0; i < this.items.length; i++) {
      let pos = this.newPosList[i];
      this.items[i].setPos(pos[0], pos[1]);
    }
  }
}
