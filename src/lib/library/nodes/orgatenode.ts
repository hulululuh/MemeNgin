import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { Property, PropertyType } from "@/lib/designer/properties";
export class OrGateNode extends LogicDesignerNode {
  aProp: Property;
  bProp: Property;

  init() {
    this.title = "OrGate";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Bool;

    this.aProp = this.addBoolProperty("valueA", "A", false);
    this.bProp = this.addBoolProperty("valueB", "B", false);
    this.aProp.setExposed(true);
    this.bProp.setExposed(true);
  }

  calculated() {
    let valA = this.getPropertyValue(0);
    let valB = this.getPropertyValue(1);
    return valA || valB;
  }
}
