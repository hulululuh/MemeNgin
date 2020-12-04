import { SocketGraphicsItem, SocketType } from "./socketgraphicsitem";
import { ImageCanvas } from "../designer/imagecanvas";
import {
  GraphicsItem,
  MouseDownEvent,
  MouseMoveEvent,
  MouseUpEvent,
  WidgetEvent,
} from "./graphicsitem";
import { NodeScene } from "../scene";
import { Vector2 } from "@math.gl/core";
import { MoveItemsAction } from "../actions/moveItemsaction";
import { UndoStack } from "../undostack";

export class NodeGraphicsItemRenderState {
  hovered: boolean = false;
  selected: boolean = false;
}

export class NodeGraphicsItem extends GraphicsItem {
  id!: string;
  sockets: SocketGraphicsItem[] = Array();
  title: string;
  thumbnail!: HTMLImageElement;
  imageCanvas: ImageCanvas;
  relScale: number;

  // over-layed visual objects such as rectangle indicating detected objects
  helperViz: any;

  hit: boolean;

  // albedo, normal, height, etc...
  textureChannel: string;

  dragStartPos: Vector2;

  constructor(title: string) {
    super();
    this.width = 100;
    this.height = 100;
    this.title = title;
    this.imageCanvas = new ImageCanvas();
    this.hit = false;
    this.helperViz = null;

    // const scale = Math.min(width, height);
    // this.relScale = 100 / scale;
  }

  // resize graphics node by given image size
  setVirtualSize(width: number, height: number) {
    let wScaled = 100;
    let hScaled = 100;

    const scale = Math.min(width, height);
    this.relScale = 100 / scale;

    if (width !== height) {
      wScaled = width * this.relScale;
      hScaled = height * this.relScale;
    }

    // create node from designer
    if (this.getWidth() !== wScaled || this.getHeight() !== hScaled) {
      this.setSize(wScaled, hScaled);
      this.imageCanvas.resize(wScaled, hScaled);
      this.sortSockets();
    }
  }

  setScene(scene: NodeScene) {
    this.scene = scene;

    for (let sock of this.sockets) sock.setScene(scene);
  }

  setTextureChannel(name: string) {
    this.textureChannel = name;
  }

  clearTextureChannel() {
    this.textureChannel = null;
  }

  setThumbnail(thumbnail: HTMLImageElement) {
    this.thumbnail = thumbnail;
  }

  move(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
    for (let sock of this.sockets) {
      sock.move(dx, dy);
    }
  }

  draw(ctx: CanvasRenderingContext2D, renderData: any) {
    const renderState = <NodeGraphicsItemRenderState>renderData;

    // border
    if (renderState.selected) {
      ctx.strokeStyle = "rgb(255, 255, 255)";
      ctx.beginPath();
      ctx.lineWidth = 8;
      //ctx.rect(this.x, this.y, this.width, this.height);
      this.roundRect(ctx, this.x, this.y, this.width, this.height, 2);
      ctx.stroke();
    }

    // // background
    // ctx.beginPath();
    // ctx.fillStyle = "rgb(0, 0, 0)";
    // ctx.rect(this.x, this.y, this.width, this.height);
    // ctx.fill();

    // thumbnail if any
    if (this.thumbnail) {
      ctx.drawImage(this.thumbnail, this.x, this.y, this.width, this.height);
    } else {
      ctx.drawImage(
        this.imageCanvas.canvas,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }

    if (this.helperViz) {
      this.helperViz.forEach((box) => {
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1;

        const w = box.right;
        const h = box.top;

        ctx.rect(
          this.x + box.left * this.relScale,
          this.y + box.top * this.relScale,
          Math.abs(box.right - box.left) * this.relScale,
          Math.abs(box.bottom - box.top) * this.relScale
        );
        ctx.stroke();

        ctx.beginPath();
        const text = `${box.className}: ${(box.classProb * 100).toFixed(2)} %`;
        let size = ctx.measureText(text.toUpperCase());
        let textX = this.centerX() - size.width / 2;
        let textY = this.y + this.height + 14;
        ctx.font = "bold 9px 'Open Sans'";
        ctx.fillText(text.toUpperCase(), textX, textY);
      });
    }

    // title
    if (!renderState.hovered) {
      ctx.beginPath();
      ctx.fillStyle = "rgb(0,0,0)";
      ctx.rect(this.x, this.y, this.width, 20);
      ctx.fill();

      ctx.beginPath();
      //ctx.font = "14px monospace";
      ctx.font = "bold 9px 'Open Sans'";
      ctx.fillStyle = "rgb(255,255,255)";
      let size = ctx.measureText(this.title);
      let textX = this.centerX() - size.width / 2;
      let textY = this.y + 14;
      ctx.fillText(this.title, textX, textY);
    }

    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgb(0, 0, 0)";

    const offset = ctx.lineWidth / 2 - 0.0001;
    this.roundRect(
      ctx,
      this.x - offset,
      this.y - offset,
      this.width + offset * 2,
      this.height + offset * 2,
      offset
    );
    ctx.stroke();
    ctx.globalAlpha = 1;

    for (let sock of this.sockets) {
      sock.draw(ctx, renderState);
    }

    // texture channel
    if (this.textureChannel) {
      ctx.beginPath();
      //ctx.font = "14px monospace";
      ctx.font = "12px 'Open Sans'";
      ctx.fillStyle = "rgb(200, 255, 200)";
      let size = ctx.measureText(this.textureChannel.toUpperCase());
      let textX = this.centerX() - size.width / 2;
      let textY = this.y + this.height + 14;
      ctx.fillText(this.textureChannel.toUpperCase(), textX, textY);
    }
  }

  setPos(x: number, y: number) {
    super.setPos(x, y);
    this.sortSockets();
  }

  setCenter(x: number, y: number) {
    super.setCenter(x, y);
    this.sortSockets();
  }

  sortSockets() {
    // top and bottom padding for sockets
    let pad = 10;

    // sort in sockets
    let socks = this.getInSockets();
    let incr = (this.height - pad * 2) / socks.length;
    let mid = incr / 2.0;
    let i = 0;
    for (let sock of socks) {
      let y = pad + i * incr + mid;
      let x = this.x;
      sock.setCenter(x, this.y + y);
      i++;
    }

    // sort out sockets
    socks = this.getOutSockets();
    incr = (this.height - pad * 2) / socks.length;
    mid = incr / 2.0;
    i = 0;
    for (let sock of socks) {
      let y = pad + i * incr + mid;
      let x = this.x + this.width;
      sock.setCenter(x, this.y + y);
      i++;
    }
  }

  getInSockets() {
    let array = new Array();
    for (let sock of this.sockets) {
      if (sock.socketType == SocketType.In) array.push(sock);
    }

    return array;
  }

  getInSocketByName(name: string): SocketGraphicsItem {
    for (let sock of this.sockets) {
      if (sock.socketType == SocketType.In)
        if (sock.title == name)
          //todo: separate title from name
          return sock;
    }

    return null;
  }

  getOutSockets() {
    let array = new Array();
    for (let sock of this.sockets) {
      if (sock.socketType == SocketType.Out) array.push(sock);
    }

    return array;
  }

  getOutSocketByName(name: string): SocketGraphicsItem {
    // blank or empty name means first out socket
    if (!name) {
      let socks = this.getOutSockets();
      if (socks.length > 0) return socks[0];
      else {
        console.log(
          "[warning] attempting to get  output socket from node with no output sockets"
        );
        return null;
      }
    }

    for (let sock of this.sockets) {
      if (sock.socketType == SocketType.Out)
        if (sock.title == name)
          //todo: separate title from name
          return sock;
    }

    return null;
  }

  // adds socket to node
  addSocket(name: string, id: string, type: SocketType) {
    let sock = new SocketGraphicsItem();
    sock.id = id;
    sock.title = name;
    sock.node = this;
    sock.socketType = type;
    this.sockets.push(sock);

    this.sortSockets();
  }

  // MOUSE EVENTS
  mouseDown(evt: MouseDownEvent) {
    this.hit = true;
    this.dragStartPos = new Vector2(this.x, this.y);
  }

  mouseMove(evt: MouseMoveEvent) {
    if (this.hit) {
      // movement
      this.move(evt.deltaX, evt.deltaY);

      if (document) {
        const event = new WidgetEvent("widgetUpdate", {
          detail: {
            enable: false,
          },
        });

        document.dispatchEvent(event);
      }
    }
  }

  mouseUp(evt: MouseUpEvent) {
    this.hit = false;

    // add undo/redo
    let newPos = new Vector2(this.x, this.y);

    if (newPos.x != this.dragStartPos.x || newPos.y != this.dragStartPos.y) {
      let action = new MoveItemsAction([this], [this.dragStartPos], [newPos]);

      UndoStack.current.push(action);
    }
  }
}
