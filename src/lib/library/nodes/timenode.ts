// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { PropertyType } from "@/lib/designer/properties";

export class TimeNode extends LogicDesignerNode {
  init() {
    this.title = "Time";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Float;

    this.addFloatProperty("progress", "Progress", 0.0, 0.0, 1.0, 0.0001);
    this.addIntProperty("fps", "FPS", 24, 6, 60, 1);
    this.addFloatProperty("duration", "Duration(s)", 3.0, 0.5, 10.0, 0.001);
  }

  calculated() {
    return this.getPropertyValue(0).toFixed(4);
  }
}
