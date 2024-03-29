// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { Action } from "../undostack";
import { ConnectionGraphicsItem } from "../scene/connectiongraphicsitem";
import { NodeScene } from "../scene";

export enum ConnectionSwitchAction {
  Add = "add",
  Remove = "delete",
}

export class SwitchConnectionAction extends Action {
  scene: NodeScene;
  cons: ConnectionGraphicsItem[];
  actions: ConnectionSwitchAction[]; //'add' or 'remove'

  constructor(
    scene: NodeScene,
    cons: ConnectionGraphicsItem[],
    actions: ConnectionSwitchAction[]
  ) {
    super();

    this.scene = scene;
    this.cons = cons;
    this.actions = actions;
  }

  undo() {
    for (let i = this.cons.length - 1; i >= 0; i--) {
      if (this.actions[i] == ConnectionSwitchAction.Add) {
        this.scene.removeConnection(this.cons[i]);
      } else if (this.actions[i] == ConnectionSwitchAction.Remove) {
        this.scene.addConnection(this.cons[i]);
      } else {
        throw "Invalid connection undo-redo action";
      }
    }
  }

  redo() {
    for (let i = 0; i < this.cons.length; i++) {
      if (this.actions[i] == ConnectionSwitchAction.Add) {
        this.scene.addConnection(this.cons[i]);
      } else if (this.actions[i] == ConnectionSwitchAction.Remove) {
        this.scene.removeConnection(this.cons[i]);
      } else {
        throw "Invalid connection undo-redo action";
      }
    }
  }
}
