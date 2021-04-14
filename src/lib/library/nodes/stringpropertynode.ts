import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";

export class StringPropertyNode extends LogicDesignerNode {
  init() {
    this.title = "StringProperty";
    this.logicType = LogicType.Property;

    this.addStringProperty("value", "Value", "");
  }
}
