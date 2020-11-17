import { ApplicationSettings } from "@/settings";
import { Vector2 } from "@math.gl/core";

// collision margin in pixels
const settings = ApplicationSettings.getInstance();

enum ColliderType {
  None,
  Line,
  Circle,
  Rect,
}

export interface iCollider {
  type: ColliderType;

  // resulting value - cursor
  label: string;

  isIntersectWith(pt: Vector2, zoomFactor: number): boolean;
  getCenter(): Vector2;
  setPts(pts: Array<Vector2>);
}

export class CircleCollider implements iCollider {
  type: ColliderType;
  label: string;
  protected _idx: number;
  protected _radius: number;
  protected _pts: Array<Vector2>;

  constructor(
    label: string,
    idx: number,
    radius: number,
    pts?: Array<Vector2>
  ) {
    this.type = ColliderType.Circle;
    this.label = label;
    this._idx = idx;
    this._pts = pts;
    this._radius = radius;
  }

  isIntersectWith(pt: Vector2, zoomFactor: number = 1): boolean {
    if (!this._pts) {
      console.warn("intersection test without data");
      return;
    }
    const distance = pt.distanceTo(this._pts[this._idx]);
    return distance < (settings.colThicknessCircle + this._radius) / zoomFactor;
  }

  getCenter(): Vector2 {
    return this._pts[this._idx];
  }

  setPts(pts: Array<Vector2>) {
    this._pts = pts;
  }
}

export class LineCollider implements iCollider {
  type: ColliderType;
  label: string;
  protected _idxA: number;
  protected _idxB: number;
  protected _pts: Array<Vector2>;

  constructor(label: string, idxA: number, idxB: number, pts?: Array<Vector2>) {
    this.type = ColliderType.Line;
    this.label = label;
    this._idxA = idxA;
    this._idxB = idxB;
    this._pts = pts;
  }

  isIntersectWith(pt: Vector2, zoomFactor: number = 1): boolean {
    if (!this._pts) {
      console.warn("intersection test without data");
      return;
    }

    const pt1 = this._pts[this._idxA];
    const pt2 = this._pts[this._idxB];

    if (!pt1 || !pt2) {
      return false;
    }

    const dir = new Vector2(pt2).sub(pt1);
    const dir2 = new Vector2(pt).sub(pt1);

    const t = dir2.dot(new Vector2(dir).normalize());
    const closestPt = new Vector2(pt1).add(
      new Vector2(dir).normalize().multiplyByScalar(t)
    );

    const distance = pt.distanceTo(closestPt);
    return (
      distance < settings.colThicknessLine / zoomFactor &&
      t > 0 &&
      t < dir.len()
    );
  }

  getCenter(): Vector2 {
    const pt1 = this._pts[this._idxA];
    const pt2 = this._pts[this._idxB];
    return new Vector2(pt1).add(pt2).divideScalar(2);
  }

  setPts(pts: Array<Vector2>) {
    this._pts = pts;
  }
}
