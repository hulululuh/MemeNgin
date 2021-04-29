export class UndoStackEvent extends CustomEvent<any> {}

export class Action {
  redo() {}
  undo() {}
}

//  https://gist.github.com/dsamarin/3050311
// https://github.com/agrinko/js-undo-manager
export class UndoStack {
  static current: UndoStack;

  stack: Action[];
  pointer: number;

  constructor() {
    this.pointer = -1;
    this.stack = [];
  }

  push(action: Action) {
    this.pointer += 1;
    this.stack.splice(this.pointer);

    this.stack.push(action);
    console.log(action);

    // editing started
    if (document && this.pointer == 0) {
      const event = new UndoStackEvent("editStarted");
      document.dispatchEvent(event);
    }
  }

  undo() {
    if (this.pointer < 0) return;

    let action = this.stack[this.pointer];
    action.undo();

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

    let action = this.stack[this.pointer];
    action.redo();
  }

  reset() {
    this.pointer = -1;
    this.stack = [];
  }
}
