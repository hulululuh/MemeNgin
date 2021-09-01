// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { Property, PropertyType } from "@/lib/designer/properties";
export class InterpolatorNode extends LogicDesignerNode {
  aProp: Property;
  bProp: Property;
  wProp: Property;

  init() {
    this.title = "Interpolator";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Float;

    this.aProp = this.addFloatProperty("valueA", "A", 0.0, 0.0, 1.0, 0.001);
    this.bProp = this.addFloatProperty("valueB", "B", 1.0, 0.0, 1.0, 0.001);
    this.wProp = this.addFloatProperty(
      "weight",
      "Weight",
      0.5,
      0.0,
      1.0,
      0.001
    );
    this.aProp.setExposed(true);
    this.bProp.setExposed(true);
    this.wProp.setExposed(true);
  }

  calculated() {
    let valA = this.getPropertyValue(0);
    let valB = this.getPropertyValue(1);
    let w = this.getPropertyValue(2);
    return (valA * (1 - w) + valB * w).toFixed(3);
  }
}
