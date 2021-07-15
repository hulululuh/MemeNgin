// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { Property, PropertyType } from "@/lib/designer/properties";
export class GreaterEqNode extends LogicDesignerNode {
  aProp: Property;
  bProp: Property;

  init() {
    this.title = "GreaterEq";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Bool;

    this.aProp = this.addFloatProperty("valueA", "A", 0.0, 0.0, 1.0);
    this.bProp = this.addFloatProperty("valueB", "B", 1.0, 0.0, 1.0);
    this.aProp.setExposed(true);
    this.bProp.setExposed(true);
  }

  calculated() {
    let valA = this.getPropertyValue(0);
    let valB = this.getPropertyValue(1);
    return valA >= valB ? true : false;
  }
}
