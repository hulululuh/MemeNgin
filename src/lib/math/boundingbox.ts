// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { Vector2 } from "@math.gl/core";
import { Rect } from "@/lib/math/rect";

export class BoundingBox {
  min: Vector2;
  max: Vector2;

  constructor(min: Vector2, max: Vector2) {
    this.min = min.clone();
    this.max = max.clone();
  }

  clone(): BoundingBox {
    return new BoundingBox(this.min, this.max);
  }

  center(): Vector2 {
    return new Vector2(
      (this.min.x + this.max.x) / 2,
      (this.min.y + this.max.y) / 2
    );
  }

  width(): number {
    return this.max.x - this.min.x;
  }

  height(): number {
    return this.max.y - this.min.y;
  }

  static merge(a: BoundingBox, b: BoundingBox): BoundingBox {
    const min = new Vector2(
      Math.min(a.min.x, b.min.x),
      Math.min(a.min.y, b.min.y)
    );
    const max = new Vector2(
      Math.max(a.max.x, b.max.x),
      Math.max(a.max.y, b.max.y)
    );
    return new BoundingBox(min, max);
  }

  static fromRect(rect: Rect): BoundingBox {
    return new BoundingBox(
      new Vector2(rect.x, rect.y),
      new Vector2(rect.x + rect.width, rect.y + rect.height)
    );
  }
}
