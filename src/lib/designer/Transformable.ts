import { Matrix3 } from "@math.gl/core";
import { Transform2D } from "@/lib/math/transform2d";

export interface ITransformable {
  getTransform: () => Transform2D;
  getTransformWidget: () => Transform2D;
  getTransformGL: () => Matrix3;

  isWidgetAvailable: () => boolean;
  requestUpdateWidget: () => void;
}
