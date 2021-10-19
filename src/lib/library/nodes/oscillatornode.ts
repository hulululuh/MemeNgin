// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { Property, PropertyType } from "@/lib/designer/properties";

export class OscillatorNode extends LogicDesignerNode {
  inputProp: Property;
  outputType = PropertyType.Float;

  init() {
    this.title = "Oscillator";
    this.logicType = LogicType.Operator;

    this.inputProp = this.addFloatProperty("input", "Input", 0.0, 0.0, 1.0);
    this.inputProp.setExposed(true);
  }

  calculated() {
    const input: number = parseFloat(this.getPropertyValue(0));
    let calculated = input <= 0.5 ? input * 2 : 1 - (input - 0.5) * 2;
    return calculated.toFixed(3);
  }
}
