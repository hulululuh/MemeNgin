// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { Action } from "../undostack";
import { Rect } from "@/lib/math/rect";
import { FrameGraphicsItem } from "../scene/framegraphicsitem";

export class ResizeFrameAction extends Action {
  frame: FrameGraphicsItem;
  oldRect: Rect;
  newRect: Rect;

  constructor(frame: FrameGraphicsItem, oldRect: Rect, newRect: Rect) {
    super();

    this.frame = frame;
    this.oldRect = oldRect;
    this.newRect = newRect;
  }

  undo() {
    this.frame.setFrameRect(this.oldRect);
  }

  redo() {
    this.frame.setFrameRect(this.newRect);
  }
}
