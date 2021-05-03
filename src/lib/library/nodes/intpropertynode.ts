import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { PropertyType } from "@/lib/designer/properties";

export class IntPropertyNode extends LogicDesignerNode {
  init() {
    this.title = "IntProperty";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Int;

    this.addIntProperty("value", "Value");
  }

  calculated() {
    return this.getPropertyValue(0);
  }
}
