// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { Property, PropertyType } from "@/lib/designer/properties";
import store from "../../../store";

export class TimeNode extends LogicDesignerNode {
  propNumFrames: Property;

  init() {
    this.title = "Time";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Float;

    this.addFloatProperty("progress", "Progress", 0.0, 0.0, 1.0, 0.0001);
    this.addIntProperty("fps", "FPS", 24, 1, 60, 1);
    this.addFloatProperty("duration", "Duration(s)", 1.0, 0.05, 10.0, 0.001);
    this.propNumFrames = this.addFloatProperty(
      "numFrames",
      "NumFrames",
      0,
      0,
      1,
      0.001,
      false
    );

    this.updateProps();

    this.onnodepropertychanged = function(prop: Property) {
      if (prop.name === "value") {
        this.requestUpdate();
      } else if (prop.name === "fps" || prop.name === "duration") {
        this.updateProps();
      }
    };
  }

  get numFrames() {
    const fps = this.getPropertyValueByName("fps");
    const duration = this.getPropertyValueByName("duration");
    return Math.max(Math.floor(fps * duration), 1);
  }

  get timePerFrame() {
    const fps = this.getPropertyValueByName("fps");
    return 1 / fps;
  }

  updateProps() {
    this.propNumFrames.setValue(this.numFrames);
    store.state.stepSize = 100 / this.numFrames;
  }

  calculated() {
    let propVal = this.getPropertyValue(0);
    return propVal ? propVal.toFixed(4) : 0;
  }

  setProgress(progress: number) {
    const pProp = this.properties.find((item) => item.name == "progress");
    this.setProperty("progress", {
      value: progress,
      exposed: pProp.getExposed(),
    });
  }
}
