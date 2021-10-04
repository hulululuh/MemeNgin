// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

export class UndoStackEvent extends CustomEvent<any> {}

export class Action {
  redo() {}
  undo() {}
}

//  https://gist.github.com/dsamarin/3050311
// https://github.com/agrinko/js-undo-manager
export class UndoStack {
  static current: UndoStack;

  stack: any[];
  pointer: number;

  constructor() {
    this.pointer = -1;
    this.stack = [];
  }

  push(action: any) {
    this.pointer += 1;
    this.stack.splice(this.pointer);
    this.stack.push(action);
    console.log(action);

    // editing started
    if (document && this.pointer == 0) {
      const event = new UndoStackEvent("editStarted");
      document.dispatchEvent(event);
    }

    document.dispatchEvent(new Event("editing"));
  }

  undo() {
    if (this.pointer < 0) return;

    let action = this.stack[this.pointer];
    if (action instanceof Action) {
      action.undo();
    } else {
      for (let a of action) {
        if (a instanceof Action) {
          a.undo();
        }
      }
    }

    this.pointer -= 1;

    // editing ended
    if (document && this.pointer < 0) {
      const event = new UndoStackEvent("editEnded");
      document.dispatchEvent(event);
    }
  }

  redo() {
    if (this.pointer >= this.stack.length - 1) return;

    this.pointer += 1;

    if (document && this.pointer == 0) {
      const event = new UndoStackEvent("editStarted");
      document.dispatchEvent(event);
    }

    let action = this.stack[this.pointer];
    if (action instanceof Action) {
      action.redo();
    } else {
      for (let a of action) {
        if (a instanceof Action) {
          a.redo();
        }
      }
    }
  }

  reset() {
    this.pointer = -1;
    this.stack = [];
  }
}
