import { Vector2, Matrix3 } from "@math.gl/core";
import { Transform } from "node:stream";

export class Transform2D {
  position: Vector2;
  scale: Vector2;
  rotation: number;
  static _identity: Transform2D;

  static get IDENTITY() {
    if (!Transform2D._identity) {
      Transform2D._identity = new Transform2D(
        new Vector2(0, 0),
        new Vector2(1, 1),
        0
      );
    }

    return Transform2D._identity.clone();
  }

  constructor(p: Vector2, s: Vector2, r: number) {
    this.position = new Vector2(p[0], p[1]);
    this.scale = new Vector2(s[0], s[1]);
    this.rotation = r;
  }

  clone(): Transform2D {
    return new Transform2D(this.position, this.scale, this.rotation);
  }

  setPosition(pos: Vector2) {
    this.position = new Vector2(pos);
  }

  setScale(s: Vector2) {
    this.scale = new Vector2(s);
  }

  setRotation(r: number) {
    this.rotation = r;
  }

  toMatrix(): Matrix3 {
    return new Matrix3()
      .translate([this.position[0], this.position[1]])
      .rotate(this.rotation)
      .scale([this.scale[0], this.scale[1]]);
  }

  equals(other: Transform2D) {
    return (
      this.position.equals(other.position) &&
      this.scale.equals(other.scale) &&
      this.rotation == other.rotation
    );
  }
}
