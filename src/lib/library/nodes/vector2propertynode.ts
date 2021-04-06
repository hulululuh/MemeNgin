import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { Vector2 } from "@math.gl/core";

export class Vector2PropertyNode extends LogicDesignerNode {
  init() {
    this.title = "Vector2Property";
    this.logicType = LogicType.Property;

    this.addVector2Property("value", "Vector2Property", new Vector2(0, 0));
  }
}
