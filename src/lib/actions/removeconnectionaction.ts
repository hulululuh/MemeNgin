// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { Action } from "../undostack";
import { ConnectionGraphicsItem } from "../scene/connectiongraphicsitem";
import { NodeScene } from "../scene";

export class RemoveConnectionAction extends Action {
  scene: NodeScene;
  con: ConnectionGraphicsItem;

  constructor(scene: NodeScene, con: ConnectionGraphicsItem) {
    super();

    this.scene = scene;
    this.con = con;
  }

  undo() {
    this.scene.addConnection(this.con);
  }

  redo() {
    this.scene.removeConnection(this.con);
  }
}
