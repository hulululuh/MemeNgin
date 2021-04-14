import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";

export class BoolPropertyNode extends LogicDesignerNode {
  init() {
    this.title = "BoolProperty";
    this.logicType = LogicType.Property;

    this.addBoolProperty("value", "Value", false);
  }
}
