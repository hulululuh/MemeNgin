import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { Vector2 } from "@math.gl/core";
import { PropertyType } from "@/lib/designer/properties";

export class Vector2PropertyNode extends LogicDesignerNode {
  init() {
    this.title = "Vector2Property";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Vector2;

    this.addVector2Property("value", "Value", new Vector2(0, 0));
  }

  calculated() {
    return this.getPropertyValue(0);
  }
}
