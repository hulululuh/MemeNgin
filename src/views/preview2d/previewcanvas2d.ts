// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { Vector2 } from "@math.gl/core";

const IMAGE_RENDER_SIZE = 1000;

function _getMousePos(canvas, evt) {
  let rect = canvas.getBoundingClientRect();
  return new Vector2(evt.clientX - rect.left, evt.clientY - rect.top);
}

function Rectangle(x, y, width, height, color, ctx) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.color = color;
  this.draw = function() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  };
}

export class DragZoom {
  canvases: Array<HTMLCanvasElement>;

  mousePos: Vector2;
  prevMousePos: Vector2;
  mouseDownPos: Vector2; // pos of last mouse down

  zoomFactor: number;
  offset: Vector2;

  panning: boolean;
  panStart: SVGPoint;

  //rect: Rect;
  image: HTMLCanvasElement;

  constructor(canvases: Array<HTMLCanvasElement>) {
    this.canvases = canvases;
    this.image = null;

    for (let canvas of this.canvases) {
      let self = this;
      canvas.addEventListener(
        "mousemove",
        function(evt: MouseEvent) {
          self.onMouseMove(evt);
        },
        { capture: true, passive: false }
      );
      canvas.addEventListener(
        "mousedown",
        function(evt: MouseEvent) {
          self.onMouseDown(evt);
        },
        { capture: true, passive: false }
      );
      canvas.addEventListener(
        "mouseup",
        function(evt: MouseEvent) {
          self.onMouseUp(evt);
        },
        { capture: true, passive: false }
      );
      canvas.addEventListener(
        "mouseout",
        function(evt: MouseEvent) {
          self.onMouseOut(evt);
        },
        { capture: true, passive: false }
      );
      canvas.addEventListener(
        "mousewheel",
        function(evt: WheelEvent) {
          self.onMouseScroll(evt);
        },
        { capture: true, passive: false }
      );
      canvas.addEventListener(
        "contextmenu",
        function(evt: MouseEvent) {
          evt.preventDefault();
        },
        { capture: true, passive: false }
      );
      canvas.addEventListener(
        "resize",
        function(evt: MouseEvent) {
          console.log("2d canvas resized");
        },
        { capture: true, passive: false }
      );

      this.zoomFactor = 0.5;

      this.mousePos = new Vector2(0, 0);
      this.prevMousePos = new Vector2(0, 0);
      this.mouseDownPos = new Vector2(0, 0);

      // offset to put center(0,0) in middle of view
      this.offset = new Vector2(canvas.width * 0.5, canvas.height * 0.5);
    }
  }

  get background() {
    return this.canvases[1];
  }

  get canvas() {
    return this.canvases[0];
  }

  get context() {
    const ctx = this.canvas.getContext("2d");
    return ctx;
  }

  onResize(width: number, height: number) {
    this.offset = new Vector2(width * 0.5, height * 0.5);
    this.centerImage();
  }

  // puts image in center and set appropriate zoom level
  centerImage(zoomFactor = 0.5) {
    for (let canvas of this.canvases) {
      this.offset = new Vector2(canvas.width * 0.5, canvas.height * 0.5);
      this.zoomFactor = zoomFactor;

      const ctx = canvas.getContext("2d");

      ctx.setTransform(
        this.zoomFactor,
        0,
        0,
        this.zoomFactor,
        this.offset[0],
        this.offset[1]
      );
    }
  }

  setImage(image: HTMLCanvasElement) {
    if (image) {
      this.image = image;

      const w = this.canvas.width / this.image.width;
      const h = this.canvas.height / this.image.height;
      let zoomFactor = w > h ? h : w;

      // center image in view
      this.centerImage(zoomFactor);
    }
  }

  getAbsPos() {
    return new Vector2(this.canvas.offsetLeft, this.canvas.offsetTop);
  }

  onMouseDown(evt: MouseEvent) {
    if (evt.button == 1 || evt.button == 2) {
      this.panning = true;

      this.mouseDownPos = _getMousePos(this.canvas, evt);
    }

    this.mousePos = _getMousePos(this.canvas, evt);
  }

  onMouseUp(evt: MouseEvent) {
    // this.mouseX = pos.x;
    // this.mouseY = pos.y;
    if (evt.button == 1 || evt.button == 2) {
      this.panning = false;
    }
  }

  onMouseMove(evt: MouseEvent) {
    this.prevMousePos = this.mousePos;
    this.mousePos = _getMousePos(this.canvas, evt);

    if (this.panning) {
      const prev = this.canvasToScene(this.prevMousePos);
      const cur = this.canvasToScene(this.mousePos);
      const diff = new Vector2(prev.x - cur.x, prev.y - cur.y);
      // const diff = new Vector2(this.prevMousePos.x - this.mousePos.x, this.prevMousePos.y - this.mousePos.y);

      const factor = this.zoomFactor;
      this.offset = new Vector2(this.offset[0], this.offset[1]).sub(
        diff.clone().multiplyByScalar(factor)
      );
    }
  }

  onMouseScroll(evt: WheelEvent) {
    // no panning while zooming
    if (this.panning) return;

    let pos = _getMousePos(this.canvas, evt);
    let delta = (evt as any).wheelDelta > 0 ? 1.1 : 1.0 / 1.1;

    // offset from mouse pos
    // find offset from previous zoom then move offset by that value

    this.zoomFactor *= delta;
    this.offset = pos.clone().sub(
      pos
        .clone()
        .sub(this.offset)
        .multiplyByScalar(delta)
    );
    // this.offset.x = pos.x - (pos.x - this.offset.x) * delta; // * (factor);
    // this.offset.y = pos.y - (pos.y - this.offset.y) * delta; // * (factor);

    //this.zoom(pos.x, pos.y, delta);

    evt.preventDefault();
    return false;
  }

  onMouseOut(evt: MouseEvent) {
    // cancel panning
    this.panning = false;
  }

  zoom(x: number, y: number, level: number) {
    // let scaleFactor = 1.01;
    // let pt = this.contextExtra.transformedPoint(x,y);
    // let factor = Math.pow(scaleFactor, level);
  }

  draw() {
    this.drawBackground();

    const ctx = this.canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(
      this.zoomFactor,
      0,
      0,
      this.zoomFactor,
      this.offset[0],
      this.offset[1]
    );

    if (this.image) {
      this.drawImage(0, 0);
    }
  }

  drawImage(offsetX: number, offsetY: number) {
    const w = this.image.width;
    const h = this.image.height;

    const x = -w * 0.5 + offsetX * w;
    const y = -h * 0.5 + offsetY * h;

    const ctx = this.context;
    ctx.drawImage(this.image, x, y, w, h);
  }

  // converts from canvas(screen) coords to the scene(world) coords
  canvasToScene(pos: Vector2): Vector2 {
    const zoomFactor = Math.max(this.zoomFactor, Number.EPSILON);
    return new Vector2(pos[0], pos[1])
      .sub(this.offset)
      .multiplyByScalar(1 / zoomFactor);
  }

  drawBackground() {
    const background = this.background;
    let ctx = background.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.clearRect(0, 0, background.width, background.height);
    ctx.fillRect(0, 0, background.width, background.height);

    const gridSize = 12;
    const rows = Math.ceil(background.height / gridSize);
    const cols = Math.ceil(background.width / gridSize);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const skip = ((i % 2) + (j % 2)) % 2 == 0;
        if (skip) continue;

        const x = j * gridSize;
        const y = i * gridSize;
        let rectangle = new Rectangle(
          x,
          y,
          gridSize,
          gridSize,
          "rgb(200, 200, 200)",
          ctx
        );
        rectangle.draw();
      }
    }
    ctx.setTransform(
      this.zoomFactor,
      0,
      0,
      this.zoomFactor,
      this.offset[0],
      this.offset[1]
    );
  }
}
