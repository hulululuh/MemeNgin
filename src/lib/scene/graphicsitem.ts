import { NodeScene } from "../scene";
import { Rect } from "@/lib/math/rect";
import { Transform2D } from "@/lib/math/transform2d";
import { Vector2 } from "@math.gl/core";
import { runAtThisOrScheduleAtNextAnimationFrame } from "custom-electron-titlebar/lib/common/dom";

export class MouseEvent {
  // scene space
  globalX: number;
  globalY: number;

  localX: number;
  localY: number;

  mouseButton: number;

  // modifiers
  shiftKey: boolean = false;
  altKey: boolean = false;
  ctrlKey: boolean = false;

  // default is accepted
  private accepted: boolean = true;

  accept() {
    this.accepted = true;
  }

  reject() {
    this.accepted = false;
  }

  get isAccepted() {
    return this.accepted;
  }

  get isRejected() {
    return !this.accepted;
  }
}

export class MouseDownEvent extends MouseEvent {}
export class MouseMoveEvent extends MouseEvent {
  deltaX: number;
  deltaY: number;
}
export class MouseUpEvent extends MouseEvent {}
export class MouseOverEvent extends MouseEvent {}

export class HoverEvent extends MouseEvent {}

export class WidgetEvent extends CustomEvent<any> {
  transform2d: Transform2D;
  // position: Vector2;
  // scale: Vector2;
  // rotation: number;
}

export class GraphicsItem {
  scene!: NodeScene;
  protected visible: boolean = true;
  protected active: boolean = true;
  protected _drawSelHighlight: boolean = true;

  protected x: number = 0;
  protected y: number = 0;
  protected width: number;
  protected height: number;

  // transform
  protected transform2d: Transform2D;
  // protected scale: Vector2;
  // protected position: Vector2;
  // protected rotation: number;

  constructor() {
    //this.scene = scene;
    //scene.addItem(this);
    this.width = 1;
    this.height = 1;

    this.transform2d = new Transform2D(new Vector2(0, 0), new Vector2(1, 1), 0);
    // this.scale = new Vector2(1, 1);
    // this.position = new Vector2(0, 0);
    // this.rotation = 0;
  }

  get drawSelHighlight(): boolean {
    return this._drawSelHighlight;
  }

  // sets top-left
  setPos(x: number, y: number) {
    this.x = x;
    this.y = y;

    this.transform2d.setPosition(new Vector2(this.centerX(), this.centerY()));

    //this.position = new Vector2(this.centerX(), this.centerY());
  }

  getPos() {
    return new Vector2(this.x, this.y);
  }

  setSize(w: number, h: number) {
    this.width = w;
    this.height = h;

    this.transform2d.setScale(new Vector2(w, h));

    //this.scale = new Vector2(w, h);
    //this.scale.set(this.width, this.height);
  }

  setScene(scene: NodeScene) {
    this.scene = scene;
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

  get left() {
    return this.x;
  }

  set left(value) {
    this.x = value;
  }

  get top() {
    return this.y;
  }

  set top(value) {
    this.y = value;
  }

  get right() {
    return this.x + this.width;
  }

  get bottom() {
    return this.y + this.height;
  }

  intersectsRect(other: Rect) {
    if (this.left > other.right) return false;
    if (this.right < other.left) return false;
    if (this.bottom < other.top) return false;
    if (this.top > other.bottom) return false;

    return true;
  }

  intersects(other: GraphicsItem) {
    if (this.left > other.right) return false;
    if (this.right < other.left) return false;
    if (this.bottom < other.top) return false;
    if (this.top > other.bottom) return false;

    return true;
  }

  getRect(): Rect {
    let rect = new Rect();
    rect.x = this.x;
    rect.y = this.y;
    rect.width = this.width;
    rect.height = this.height;

    return rect;
  }

  setCenter(x: number, y: number) {
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    //this.position.set(this.x, this.y);

    //this.position = new Vector2(this.centerX(), this.centerY());
    this.transform2d.setPosition(new Vector2(this.centerX(), this.centerY()));

    // this.position = new Vector2(
    //   this.x + this.width / 2,
    //   this.y + this.height / 2
    // );
  }

  centerX(): number {
    return this.x + this.width / 2;
  }

  centerY(): number {
    return this.y + this.height / 2;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  move(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;

    //this.position = new Vector2(this.centerX(), this.centerY());

    // this.position = new Vector2(
    //   this.x + this.width / 2,
    //   this.y + this.height / 2
    // );
  }

  // UTILITIES
  // https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
  roundRect(ctx: CanvasRenderingContext2D, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    //ctx.stroke();
  }

  // to be overriden
  draw(ctx: CanvasRenderingContext2D, renderData: any = null) {}

  // MOUSE EVENTS

  // STANDARD MOUSE EVENTS
  mouseDown(evt: MouseDownEvent) {}
  mouseMove(evt: MouseMoveEvent) {}
  mouseUp(evt: MouseUpEvent) {}

  // called every frame the mouse is over this object
  mouseOver(evt: MouseOverEvent) {}
}
