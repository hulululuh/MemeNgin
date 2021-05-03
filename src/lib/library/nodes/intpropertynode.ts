import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";

export class IntPropertyNode extends LogicDesignerNode {
  init() {
    this.title = "IntProperty";
    this.logicType = LogicType.Property;

    this.addIntProperty("value", "Value");
  }

  calculated() {
    return this.getPropertyValue(0);
  }
}
