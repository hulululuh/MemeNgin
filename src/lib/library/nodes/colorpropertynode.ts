// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { Color } from "@/lib/designer/color";
import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { PropertyType } from "@/lib/designer/properties";

export class ColorPropertyNode extends LogicDesignerNode {
  init() {
    this.title = "ColorProperty";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Color;

    this.addColorProperty("value", "Value", new Color(1.0, 1.0, 1.0, 1.0));
  }

  calculated() {
    return this.getPropertyValue(0);
  }
}
