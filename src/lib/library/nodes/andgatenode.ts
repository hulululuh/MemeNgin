// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { Property, PropertyType } from "@/lib/designer/properties";
export class AndGateNode extends LogicDesignerNode {
  aProp: Property;
  bProp: Property;
  outputType = PropertyType.Bool;

  init() {
    this.title = "AndGate";
    this.logicType = LogicType.Property;

    this.aProp = this.addBoolProperty("valueA", "A", false);
    this.bProp = this.addBoolProperty("valueB", "B", false);
    this.aProp.setExposed(true);
    this.bProp.setExposed(true);
  }

  calculated() {
    let valA = this.getPropertyValue(0);
    let valB = this.getPropertyValue(1);
    return valA && valB;
  }
}
