// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { PropertyType } from "@/lib/designer/properties";

export class MultiplyNode extends LogicDesignerNode {
  init() {
    this.title = "Multiply";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Float;

    let pVal = this.addFloatProperty("value", "Value", 0.0, 0.0, 1.0, 0.001);
    let pMult = this.addFloatProperty(
      "multiplier",
      "Multiplier",
      1.0,
      -100000.0,
      100000.0,
      0.001
    );

    pVal.setExposed(true);
    pMult.setExposed(true);
  }

  calculated() {
    let calculated = this.getPropertyValue(0) * this.getPropertyValue(1);
    return calculated.toFixed(3);
  }
}
