// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { CurveData, Property, PropertyType } from "@/lib/designer/properties";
import { Vector2 } from "math.gl";
import BezierEasing from "bezier-easing";

export class CurveNode extends LogicDesignerNode {
  samplerProp: Property;
  curveProp: Property;
  outputType = PropertyType.Float;

  init() {
    this.title = "Curve";
    this.logicType = LogicType.Operator;

    this.curveProp = this.addCurveProperty(
      "curve",
      "curve",
      new CurveData(new Vector2(0.25, 0.75), new Vector2(0.75, 0.25))
    );
    this.samplerProp = this.addFloatProperty(
      "sample",
      "val",
      0.0,
      0.0,
      1.0,
      0.001
    );
    this.samplerProp.setExposed(true);
  }

  calculated() {
    const curveData = this.curveProp.getValue();
    let easing = BezierEasing(
      curveData.cpStart[0],
      curveData.cpStart[1],
      curveData.cpEnd[0],
      curveData.cpEnd[1]
    );

    let value = parseFloat(this.getPropertyValue(1));

    return easing(value).toFixed(3);
  }
}
