// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { PropertyType } from "@/lib/designer/properties";

export class BoolPropertyNode extends LogicDesignerNode {
  init() {
    this.title = "BoolProperty";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Bool;

    this.addBoolProperty("value", "Value", false);
  }

  calculated() {
    return this.getPropertyValue(0);
  }
}
