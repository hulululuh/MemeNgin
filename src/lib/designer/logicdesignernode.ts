// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { DesignerNode } from "@/lib/designer/designernode";
import { Property, PropertyType } from "@/lib/designer/properties";

export enum LogicType {
  Property,
  Operator,
}

export class LogicDesignerNode extends DesignerNode {
  logicType: LogicType;
  outputType!: PropertyType;

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

  calculated(): any {}

  getPropertyValue(idx: number = 0): any {
    let inputNode = this.designer.findLeftNode(
      this.id,
      this.properties[idx].name
    );

    if (inputNode && inputNode instanceof LogicDesignerNode) {
      return this.properties[idx].getParentValue();
    } else {
      return this.properties[idx].getValue();
    }
  }

  connected(leftNode: DesignerNode, rightIndex: string) {
    this.requestUpdate();
  }
}
