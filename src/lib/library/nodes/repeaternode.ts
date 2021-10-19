// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { Property, PropertyType } from "@/lib/designer/properties";

export class RepeaterNode extends LogicDesignerNode {
  inputProp: Property;
  repeatProp: Property;
  onceProp: Property;
  outputType = PropertyType.Float;

  init() {
    this.title = "Repeater";
    this.logicType = LogicType.Operator;

    this.inputProp = this.addFloatProperty("input", "Input", 0.0, 0.0, 1.0);
    this.inputProp.setExposed(true);
    this.repeatProp = this.addFloatProperty(
      "repeat",
      "Repeat",
      1.0,
      0.0,
      100.0,
      0.01
    );
    this.onceProp = this.addBoolProperty("once", "Once", false);
  }

  calculated() {
    const input: number = parseFloat(this.getPropertyValue(0));
    const repeat: number = parseFloat(this.getPropertyValue(1));
    const once: boolean = this.getPropertyValue(2);
    let stretched = input * repeat;

    let calculated = stretched;
    if (once) {
      calculated = Math.max(0, Math.min(stretched, 1));
    } else {
      calculated = stretched % 1;
    }

    return calculated.toFixed(3);
  }
}
