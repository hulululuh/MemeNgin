import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { Property, PropertyType } from "@/lib/designer/properties";
const FLOAT_MAX = 10000;
const FLOAT_MIN = -FLOAT_MAX;
export class MapFloatNode extends LogicDesignerNode {
  vProp: Property;
  minProp: Property;
  maxProp: Property;

  init() {
    this.title = "MapFloat";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.Float;

    this.vProp = this.addFloatProperty("value", "Value", 0.0, 0.0, 1.0, 0.01);
    this.vProp.setExposed(true);

    this.minProp = this.addFloatProperty(
      "min",
      "Min",
      0.0,
      FLOAT_MIN,
      FLOAT_MAX,
      0.001
    );
    this.maxProp = this.addFloatProperty(
      "max",
      "Max",
      1.0,
      FLOAT_MIN,
      FLOAT_MAX,
      0.001
    );
  }

  get minVal() {
    return this.minProp.getValue();
  }

  get maxVal() {
    return this.maxProp.getValue();
  }

  calculated() {
    // we assume input value ranged [0...1]
    let calculated =
      this.minVal + (this.maxVal - this.minVal) * this.getPropertyValue(0);
    return calculated;
  }
}
