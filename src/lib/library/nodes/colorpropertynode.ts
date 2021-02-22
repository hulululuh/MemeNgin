import { Color } from "@/lib/designer/color";
import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";

export class ColorPropertyNode extends LogicDesignerNode {
  init() {
    this.title = "ColorProperty";
    this.logicType = LogicType.Property;

    this.addColorProperty(
      "value",
      "ColorProperty",
      new Color(1.0, 1.0, 1.0, 1.0)
    );
  }
}
