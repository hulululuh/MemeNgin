// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { Color } from "./color";

export class GradientPoint {
  // position on gradient
  t: number;

  // color of point
  color: Color;

  get colorForPicker() {
    return new Color(
      this.color.r * 255,
      this.color.g * 255,
      this.color.b * 255,
      this.color.a
    );
  }
}

export class Gradient {
  points: GradientPoint[];

  constructor() {
    this.points = new Array();
  }

  addPoint(t: number, color: Color): GradientPoint {
    let point = new GradientPoint();
    point.t = t;
    point.color = color;

    this.points.push(point);
    this.sort();

    return point;
  }

  removePoint(point: GradientPoint) {
    this.points.splice(this.points.indexOf(point), 1);
  }

  clear() {
    this.points = [];
  }

  sort() {
    this.points.sort(function(a: GradientPoint, b: GradientPoint) {
      return a.t - b.t;
    });
  }

  sample(t: number): Color {
    if (this.points.length == 0) return new Color();
    if (this.points.length == 1) return this.points[0].color.clone();

    // here at least two points are available
    if (t < this.points[0].t) return this.points[0].color.clone();

    let last = this.points.length - 1;
    if (t > this.points[last].t) return this.points[last].color.clone();

    // find two points and lerp
    for (let i = 0; i < this.points.length - 1; i++) {
      if (this.points[i + 1].t > t) {
        let p1 = this.points[i];
        let p2 = this.points[i + 1];

        let lerpPos = (t - p1.t) / (p2.t - p1.t);
        let color = new Color();
        color.copy(p1.color);
        color.lerp(p2.color, lerpPos);

        return color;
      }
    }

    // should never get to this point
    return new Color();
  }

  clone() {
    let grad = new Gradient();
    grad.clear();

    for (let p of this.points) {
      grad.addPoint(p.t, p.color.clone());
    }

    return grad;
  }

  static parse(obj: any) {
    let gradient = new Gradient();
    for (let p of obj.points) {
      let t = p.t;
      let color = new Color();
      color.copy(p.color);

      gradient.addPoint(t, color);
    }

    return gradient;
  }

  static default() {
    let gradient = new Gradient();
    gradient.addPoint(0, new Color(0, 0, 0, 1.0));
    gradient.addPoint(1, new Color(1, 1, 1, 1.0));

    return gradient;
  }
}
