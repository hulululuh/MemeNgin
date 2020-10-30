import { Vector2 } from "@math.gl/core";

export class Rect {
  x: number = 0;
  y: number = 0;
  width: number;
  height: number;

  color: string;

  constructor() {
    //this.scene = scene;
    //scene.addItem(this);
    this.width = 1;
    this.height = 1;
    this.color = "rgb(255, 50, 50)";
  }

  setSize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  isPointInside(px: number, py: number): boolean {
    if (
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.height
    )
      return true;
    return false;
  }

  setCenter(x: number, y: number) {
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
  }

  centerX(): number {
    return this.x + this.width / 2;
  }

  centerY(): number {
    return this.y + this.height / 2;
  }

  move(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
  }

  get left() {
    return this.x;
  }

  get top() {
    return this.y;
  }

  get right() {
    return this.x + this.width;
  }

  get bottom() {
    return this.y + this.height;
  }

  get center() {
    return new Vector2(this.centerX(), this.centerY());
  }

  intersects(other: Rect) {
    if (this.left > other.right) return false;
    if (this.right < other.left) return false;
    if (this.bottom < other.top) return false;
    if (this.top > other.bottom) return false;

    return true;
  }

  expand(uniformSize: number) {
    let halfSize = uniformSize * 0.5;

    // assume it's a rect with a positive area
    this.x -= halfSize;
    this.y -= halfSize;
    this.width += halfSize * 2;
    this.height += halfSize * 2;
  }

  expandByRect(rect: Rect) {
    // assume it's a rect with a positive area
    this.x = Math.min(this.x, rect.x);
    this.y = Math.min(this.y, rect.y);
    this.width = Math.max(this.width, rect.width);
    this.height = Math.max(this.height, rect.height);
  }

  clone(): Rect {
    let rect = new Rect();
    rect.x = this.x;
    rect.y = this.y;
    rect.width = this.width;
    rect.height = this.height;

    return rect;
  }
}
