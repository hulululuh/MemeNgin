// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { PropertyType } from "@/lib/designer/properties";

export class NotGateNode extends LogicDesignerNode {
  init() {
    this.title = "NotGate";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Bool;

    let prop = this.addBoolProperty("value", "Value", false);
    prop.setExposed(true);
  }

  calculated() {
    const val: boolean = this.getPropertyValue(0);
    return !val;
  }
}
