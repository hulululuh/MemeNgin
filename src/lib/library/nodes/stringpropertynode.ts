import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { PropertyType } from "@/lib/designer/properties";

export class StringPropertyNode extends LogicDesignerNode {
  init() {
    this.title = "StringProperty";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.String;

    this.addStringProperty("value", "Value", "");
  }

  calculated() {
    return this.getPropertyValue(0);
  }
}
