// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { Action } from "../undostack";
import { IPropertyHolder } from "../designer/properties";

export class PropertyChangeAction extends Action {
  ui: () => void;
  propHolder: IPropertyHolder;
  propName: string;
  oldValue: any;
  newValue: any;

  constructor(
    ui: () => void,
    propName: string,
    propHolder: IPropertyHolder,
    oldValue: any,
    newValue: any
  ) {
    super();

    this.ui = ui;
    this.propName = propName;
    this.propHolder = propHolder;
    this.oldValue = oldValue;
    this.newValue = newValue;
  }

  undo() {
    this.propHolder.setProperty(this.propName, this.oldValue);
    //App.instance.$refs.properties.$forceUpdate();
    //this.ui.refresh();
    if (this.ui) this.ui();
  }

  redo() {
    this.propHolder.setProperty(this.propName, this.newValue);
    //this.ui.refresh();
    if (this.ui) this.ui();
  }
}
