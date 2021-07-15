// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { Property, PropertyType } from "@/lib/designer/properties";
export class NumSelectorNode extends LogicDesignerNode {
  aProp: Property;
  bProp: Property;
  sProp: Property;

  init() {
    this.title = "NumSelector";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Float;

    this.aProp = this.addFloatProperty("valueA", "A", 0.0, 0.0, 1.0);
    this.bProp = this.addFloatProperty("valueB", "B", 1.0, 0.0, 1.0);
    this.sProp = this.addBoolProperty("sel", "Sel", false);
    this.aProp.setExposed(true);
    this.bProp.setExposed(true);
    this.sProp.setExposed(true);
  }

  calculated() {
    let valA = this.getPropertyValue(0);
    let valB = this.getPropertyValue(1);
    let sel = this.getPropertyValue(2);
    return sel == false ? valA : valB;
  }
}
