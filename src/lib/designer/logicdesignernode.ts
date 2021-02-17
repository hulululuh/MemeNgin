import { DesignerNode } from "@/lib/designer/designernode";
import { Property } from "@/lib/designer/properties";

export enum LogicType {
  Property,
  Operator,
}

export class LogicDesignerNode extends DesignerNode {
  logicType: LogicType;
  constructor() {
    super();

    this.onnodepropertychanged = function(prop: Property) {
      if (prop.name === "value") {
        this.requestUpdate();
      }
    };
  }

  _init() {
    this.init();
  }

  connected(leftNode: DesignerNode, rightIndex: string) {
    this.requestUpdate();
  }
}
