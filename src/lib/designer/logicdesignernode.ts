import { DesignerNode } from "@/lib/designer/designernode";
import { Property } from "@/lib/designer/properties";

export enum LogicType {
  Property,
  Operator,
}

export class LogicDesignerNode extends DesignerNode {
  logicType: LogicType;
  isCalculated: boolean;

  constructor() {
    super();
    this.isCalculated = false;

    this.onnodepropertychanged = function(prop: Property) {
      if (prop.name === "value") {
        this.requestUpdate();
      }
    };
  }

  _init() {
    this.init();
  }

  calculated() {
    return 0;
  }

  getPropertyValue(): any {
    let inputNode = this.designer.findLeftNode(
      this.id,
      this.properties[0].name
    );

    if (inputNode && inputNode instanceof LogicDesignerNode) {
      return this.properties[0].getParentValue();
    } else {
      return this.properties[0].getValue();
    }
  }

  connected(leftNode: DesignerNode, rightIndex: string) {
    this.requestUpdate();
  }
}
