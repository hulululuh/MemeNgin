// https://github.com/freegroup/draw2d/blob/master/src/Canvas.js

//https://github.com/jgraph/mxgraph/blob/master/javascript/src/js/view/mxGraph.js#L7810

// https://bitbucket.org/nclsbrwn/texturedesigner/src/master/src/Designer/scene.ts?mode=edit&spa=0&at=master&fileviewer=file-view-default

// https://bitbucket.org/nclsbrwn/texturedesigner/src/master/

// https://stackoverflow.com/questions/45528111/javascript-canvas-map-style-point-zooming/45528455#45528455

import TWEEN from "@tweenjs/tween.js";

import { configure, Vector2 } from "@math.gl/core";
import { BoundingBox } from "@/lib/math/boundingbox";
configure({ debug: true });

// Setup the animation loop.
function animate(time) {
  requestAnimationFrame(animate);
  TWEEN.update(time);
}
requestAnimationFrame(animate);

// get local mouse position
function _getMousePos(canvas, evt): Vector2 {
  let rect = canvas.getBoundingClientRect();
  return new Vector2(evt.clientX - rect.left, evt.clientY - rect.top);
}

/*
 This class handles panning and zooming of scene
 Tracks mouse movement, position and clicks
 Also converts from scene space to screen space and
 vice versa.
*/
export class SceneView {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  // screen/canvas space
  globalMousePos: Vector2;

  mousePos: Vector2;
  prevMousePos: Vector2;
  mouseDownPos: Vector2; // pos of last mouse down
  mouseDragDiff: Vector2; // mouse drag diff

  zoomFactor: number;
  offset: Vector2;

  panning: boolean;
  panStart: SVGPoint;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");

    let self = this;
    canvas.addEventListener("mousemove", function(evt: MouseEvent) {
      self.onMouseMove(evt);
    });
    canvas.addEventListener("mousedown", function(evt: MouseEvent) {
      self.onMouseDown(evt);
    });
    canvas.addEventListener("mouseup", function(evt: MouseEvent) {
      self.onMouseUp(evt);
    });
    canvas.addEventListener("mouseout", function(evt: MouseEvent) {
      self.onMouseOut(evt);
    });
    canvas.addEventListener("mousewheel", function(evt: WheelEvent) {
      self.onMouseScroll(evt);
    });
    canvas.addEventListener("contextmenu", function(evt: MouseEvent) {
      evt.preventDefault();
    });

    // todo: do document mouse move event callback too
    document.addEventListener("mousemove", function(evt: MouseEvent) {
      self.onGlobalMouseMove(evt);
    });

    this.zoomFactor = 1;
    this.offset = new Vector2(0, 0);

    this.mousePos = new Vector2(0, 0);
    this.globalMousePos = new Vector2(0, 0);
    this.prevMousePos = new Vector2(0, 0);
    this.mouseDownPos = new Vector2(0, 0);
  }

  reset() {
    this.mousePos = new Vector2(0, 0);
    this.globalMousePos = new Vector2(0, 0);
    const center = new Vector2(this.canvas.width / 2, this.canvas.height / 2);
    this.changeView(center, 1, false);
  }

  onResized() {
    if (!this.offset) {
      this.offset = new Vector2(this.canvas.width / 2, this.canvas.height / 2);
    }
    this.changeView(this.offset, this.zoomFactor, false);
  }

  getAbsPos() {
    return new Vector2(this.canvas.offsetLeft, this.canvas.offsetTop);
  }

  isMouseOverCanvas() {
    let rect = this.canvas.getBoundingClientRect();
    if (this.globalMousePos[0] < rect.left) return false;
    if (this.globalMousePos[1] < rect.top) return false;
    if (this.globalMousePos[0] > rect.right) return false;
    if (this.globalMousePos[1] > rect.bottom) return false;

    return true;
  }

  onMouseDown(evt: MouseEvent) {
    if (evt.button == 1 || evt.button == 2) {
      this.panning = true;

      this.mouseDownPos = _getMousePos(this.canvas, evt);
    }

    this.mousePos = _getMousePos(this.canvas, evt);
  }

  onMouseUp(evt: MouseEvent) {
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
      const diff = new Vector2(prev).sub(cur);
      this.mouseDragDiff = diff;

      const factor = this.zoomFactor;
      const s = new Vector2(diff).multiplyByScalar(factor);
      this.offset = new Vector2(this.offset).sub(s);
    }
  }

  onGlobalMouseMove(evt: MouseEvent) {
    this.globalMousePos = new Vector2(evt.pageX, evt.pageY);
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
    evt.preventDefault();
    return false;
  }

  onMouseOut(evt: MouseEvent) {
    // cancel panning
    this.panning = false;
  }

  get sceneCenter(): Vector2 {
    return this.canvasToSceneXY(this.canvas.width / 2, this.canvas.height / 2);
  }

  zoom(x: number, y: number, level: number) {}

  zoomToBoundingBox(box: BoundingBox) {
    const zoomMargin = 0.8;
    const zoomX = (this.canvas.width / box.width()) * zoomMargin;
    const zoomY = (this.canvas.height / box.height()) * zoomMargin;
    const zoomFactor = Math.min(zoomX, zoomY);
    const center = this.sceneToCanvas(box.center(), zoomFactor);

    let targetOffset = new Vector2(
      this.canvas.width / 2,
      this.canvas.height / 2
    );
    targetOffset.sub(center);
    this.changeView(targetOffset, zoomFactor);
  }

  changeView(
    targetOffset: Vector2,
    targetZoomFactor: number,
    doAnimate: boolean = true
  ) {
    if (!doAnimate) {
      this.offset = new Vector2(targetOffset[0], targetOffset[1]);
      this.zoomFactor = targetZoomFactor;
    } else {
      const start = {
        x: this.offset[0],
        y: this.offset[1],
        z: this.zoomFactor,
      };
      const end = {
        x: targetOffset[0],
        y: targetOffset[1],
        z: targetZoomFactor,
      };

      const tween = new TWEEN.Tween(start)
        .to(end, 100)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          this.offset = new Vector2(start.x, start.y);
          this.zoomFactor = start.z;
        })
        .start(TWEEN.now());
    }
  }

  clear(context: CanvasRenderingContext2D, style: string = "rgb(50,50,50)") {
    const ctx = context;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    //ctx.fillStyle = "rgb(50,50,50)";
    ctx.fillStyle = style;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setViewMatrix(context: CanvasRenderingContext2D) {
    context.setTransform(
      this.zoomFactor,
      0,
      0,
      this.zoomFactor,
      this.offset[0],
      this.offset[1]
    );
  }

  drawGrid(
    ctx: CanvasRenderingContext2D,
    GRID_SIZE: number,
    strokeStyle: string,
    lineWidth: number
  ) {
    // todo: convert line points to canvas space, reset context and draw them there to preserve line width

    //const GRID_SIZE = 100;
    let tl = this.canvasToSceneXY(0, 0);
    let br = this.canvasToSceneXY(this.canvas.width, this.canvas.height);

    //ctx.strokeStyle = "#4A5050";
    //ctx.strokeStyle = "#464C4C";
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;

    // vertical
    const vCount = (br.x - tl.x) / GRID_SIZE + 1.0;
    const xStart = tl.x - (tl.x % GRID_SIZE);
    for (let i = 0; i < vCount; i++) {
      ctx.beginPath();
      ctx.moveTo(xStart + i * GRID_SIZE, tl.y);
      ctx.lineTo(xStart + i * GRID_SIZE, br.y);
      ctx.stroke();
    }

    // horizontal
    const hCount = (br.y - tl.y) / GRID_SIZE + 1.0;
    const yStart = tl.y - (tl.y % GRID_SIZE);
    for (let i = 0; i < hCount; i++) {
      ctx.beginPath();
      ctx.moveTo(tl.x, yStart + i * GRID_SIZE);
      ctx.lineTo(br.x, yStart + i * GRID_SIZE);
      ctx.stroke();
    }
  }

  sceneToCanvas(pos: Vector2, zoomFactor: number): Vector2 {
    return pos.clone().multiplyByScalar(zoomFactor);
  }

  canvasToScene(pos: Vector2): Vector2 {
    return new Vector2(pos[0], pos[1])
      .sub(this.offset)
      .multiplyByScalar(1 / this.zoomFactor);
  }

  canvasToSceneXY(x: number, y: number): Vector2 {
    return new Vector2(x, y)
      .sub(this.offset)
      .multiplyByScalar(1 / this.zoomFactor);
  }

  globalToCanvasXY(x: number, y: number): Vector2 {
    let rect = this.canvas.getBoundingClientRect();
    return new Vector2(x - rect.left, y - rect.top);
  }

  getMouseSceneSpace(): Vector2 {
    return this.canvasToScene(this.mousePos);
  }

  getMouseDeltaCanvasSpace(): Vector2 {
    const prev = this.prevMousePos;
    const cur = this.mousePos;

    return cur.clone().sub(prev);
  }

  getMouseDeltaSceneSpace(): Vector2 {
    const prev = this.canvasToScene(this.prevMousePos);
    const cur = this.canvasToScene(this.mousePos);

    return cur.clone().sub(prev);
  }
}
