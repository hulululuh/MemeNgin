// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { PropertyType } from "@/lib/designer/properties";

export class FloatPropertyNode extends LogicDesignerNode {
  init() {
    this.title = "FloatProperty";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Float;

    this.addFloatProperty("value", "Value", 0.0, 0.0, 1.0, 0.001);
  }

  calculated() {
    return this.getPropertyValue(0);
  }
}
