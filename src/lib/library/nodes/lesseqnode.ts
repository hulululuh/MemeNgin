// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { Property, PropertyType } from "@/lib/designer/properties";
export class LessEqNode extends LogicDesignerNode {
  aProp: Property;
  bProp: Property;

  init() {
    this.title = "LessEq";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Bool;

    this.aProp = this.addFloatProperty("valueA", "A", 0.0, 0.0, 1.0);
    this.bProp = this.addFloatProperty("valueB", "B", 1.0, 0.0, 1.0);
    this.aProp.setExposed(true);
    this.bProp.setExposed(true);
  }

  calculated() {
    const valA: number = this.getPropertyValue(0);
    const valB: number = this.getPropertyValue(1);
    return valA <= valB ? true : false;
  }
}
