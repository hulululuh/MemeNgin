import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";

export class FloatPropertyNode extends LogicDesignerNode {
  init() {
    this.title = "FloatProperty";
    this.logicType = LogicType.Property;

    this.addFloatProperty("value", "Value", 0.0, 0.0, 1.0, 0.001);
  }
}
