// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { DesignerNode } from "@/lib/designer/designernode";
import { Property, PropertyType } from "@/lib/designer/properties";

export enum LogicType {
  Property, // It's a value
  Operator, // It's a computed value
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

  connected(leftNode: DesignerNode, rightIndex: string) {
    this.requestUpdate();
  }
}
