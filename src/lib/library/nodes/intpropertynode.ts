// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { PropertyType } from "@/lib/designer/properties";

export class IntPropertyNode extends LogicDesignerNode {
  init() {
    this.title = "IntProperty";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Float;

    this.addIntProperty("value", "Value");
  }

  calculated() {
    return Math.trunc(this.getPropertyValue(0));
  }
}
