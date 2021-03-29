import {
  SocketGraphicsItem,
  SocketInOut,
} from "@/lib/scene/socketgraphicsitem";
import { ImageCanvas } from "@/lib/designer/imagecanvas";
import {
  GraphicsItem,
  MouseDownEvent,
  MouseMoveEvent,
  MouseUpEvent,
  WidgetEvent,
} from "@/lib/scene/graphicsitem";
import { NodeScene } from "@/lib/scene";
import { Vector2 } from "@math.gl/core";
import { MoveItemsAction } from "@/lib/actions/moveItemsaction";
import { UndoStack } from "@/lib/undostack";
import { DesignerNode } from "@/lib/designer/designernode";
import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
import { LogicDesignerNode } from "@/lib/designer/logicdesignernode";
import { PropertyType } from "@/lib/designer/properties";
import { Color } from "@/lib/designer/color";
import { OutputNode } from "@/lib/library/nodes/outputnode";

export class NodeGraphicsItemRenderState {
  hovered: boolean = false;
  selected: boolean = false;
}

export class NodeGraphicsItem extends GraphicsItem {
  isLogic: boolean;
  id!: string;
  sockets: SocketGraphicsItem[] = Array();
  title: string;
  thumbnail!: HTMLImageElement;
  imageCanvas: ImageCanvas;
  value: any;
  relScale: number;

  hit: boolean;

  dragStartPos: Vector2;

  // TODO: it seems NodeGraphicsItem and DesignerNode better be de-coupled
  dNode: DesignerNode;

  doubleSized: boolean;

  constructor(node: DesignerNode) {
    super();
    this.width = 100;
    this.height = 100;
    this.title = node.title;
    this.imageCanvas = new ImageCanvas();
    this.hit = false;
    this.isLogic = node instanceof LogicDesignerNode;
    this.value = "";
    this.id = node.id;
    this.dNode = node;
    this.doubleSized = false;

    this.setupSize();
    this.setupSockets();

    // const scale = Math.min(width, height);
    // this.relScale = 100 / scale;
  }

  setupSize() {
    if (this.isLogic) {
      this.setSize(75, 36);
    } else {
      let node = this.dNode as ImageDesignerNode;
      this.doubleSized = this.dNode instanceof OutputNode;
      this.setVirtualSize(node.getWidth(), node.getHeight());
    }
  }

  setupSockets() {
    // clear existing array
    let node = this.dNode;
    this.sockets = [];

    for (let input of node.getInputs()) {
      this.addSocket(input, input, SocketInOut.In, PropertyType.Image);
    }

    for (let prop of node.getExposedProperties()) {
      this.addSocket(prop.name, prop.name, SocketInOut.In, prop.type);
    }

    // Logic designer node
    if (node instanceof LogicDesignerNode) {
      let outputType = (node as LogicDesignerNode).properties[0].type;
      this.addSocket("output", "output", SocketInOut.Out, outputType);
    } else {
      this.addSocket("output", "output", SocketInOut.Out, PropertyType.Image);
    }

    this.sortSockets();
    this.setScene(this.scene);
  }

  // resize graphics node by given image size
  setVirtualSize(width: number, height: number) {
    const scaleFactor = this.doubleSized ? 1.5 : 1.0;
    let wScaled = 100 * scaleFactor;
    let hScaled = 100 * scaleFactor;

    const scale = Math.min(width, height);
    this.relScale = 100 / scale;

    if (width !== height) {
      wScaled = width * this.relScale * scaleFactor;
      hScaled = height * this.relScale * scaleFactor;
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
    if (this.isLogic) {
      this.drawAsLogicNode(ctx, renderData);
    } else {
      this.drawAsImageNode(ctx, renderData);
    }
  }

  drawAsLogicNode(ctx: CanvasRenderingContext2D, renderData: any) {
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

    let fillColor = "rgb(0, 0, 0)";
    // convert to text
    let value = this.value;
    if (this.value instanceof Color) {
      value = this.value.toHex();
      fillColor = this.value.toHex();
    }

    // background
    ctx.beginPath();
    ctx.fillStyle = fillColor;
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fill();

    //ctx.globalAlpha = 0.65;
    // title
    //if (!renderState.hovered) {
    // ctx.beginPath();
    // ctx.fillStyle = "rgb(0,0,0)";
    // ctx.rect(this.x, this.y, this.width, 20);
    // ctx.fill();

    ctx.beginPath();
    let fontSize = 12;
    ctx.font = `bold ${fontSize}px 'Open Sans'`;
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.strokeStyle = "rgb(0,0,0, 0.5)";
    ctx.lineWidth = 0.8;

    // draw text
    let size = ctx.measureText(value);
    let textX = this.centerX() - size.width / 2;
    let textY = this.centerY() + fontSize / 4;
    ctx.strokeText(value, textX, textY);
    ctx.fillText(value, textX, textY);

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
  }

  drawAsImageNode(ctx: CanvasRenderingContext2D, renderData: any) {
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

    ctx.globalAlpha = 0.65;
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

    let imgSocks = socks.filter(
      (sock) => sock.propertyType == PropertyType.Image
    );
    let propSocks = socks.filter(
      (sock) => sock.propertyType != PropertyType.Image
    );

    let orderList = [];
    for (let prop of this.dNode.getExposedProperties()) {
      let idx = propSocks.findIndex((sock) => sock.title == prop.name);
      if (idx != -1) orderList.push(idx);
    }

    let orderedSocks = imgSocks;
    for (let order of orderList) {
      orderedSocks.push(propSocks[order]);
    }

    let incr = (this.height - pad * 2) / orderedSocks.length;
    let mid = incr / 2.0;
    let i = 0;
    for (let sock of orderedSocks) {
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
      if (sock.socketInOut == SocketInOut.In) array.push(sock);
    }

    return array;
  }

  getInSocketByName(name: string): SocketGraphicsItem {
    for (let sock of this.sockets) {
      if (sock.socketInOut == SocketInOut.In)
        if (sock.title == name)
          //todo: separate title from name
          return sock;
    }

    return null;
  }

  getOutSockets() {
    let array = new Array();
    for (let sock of this.sockets) {
      if (sock.socketInOut == SocketInOut.Out) array.push(sock);
    }

    return array;
  }

  getOutSocketByName(name: string): SocketGraphicsItem {
    // blank or empty name means first out socket
    if (!name) {
      let socks = this.getOutSockets();
      if (socks.length > 0) return socks[0];
      else {
        console.warn(
          "attempting to get output socket from node with no output sockets"
        );
        return null;
      }
    }

    for (let sock of this.sockets) {
      if (sock.socketInOut == SocketInOut.Out)
        if (sock.title == name)
          //todo: separate title from name
          return sock;
    }

    return null;
  }

  // adds socket to node
  addSocket(name: string, id: string, type: SocketInOut, propType: any) {
    let sock = new SocketGraphicsItem(propType);
    sock.id = id;
    sock.title = name;
    sock.node = this;
    sock.socketInOut = type;
    this.sockets.push(sock);
    return sock;
  }

  addSocketByProp(propName: string, type: string) {
    let socket = this.addSocket(propName, propName, SocketInOut.In, type);
    if (this.scene) {
      socket.setScene(this.scene);
    } else {
      console.error("scene is required");
    }
  }

  removeSocketByProp(propName: string) {
    let idx = this.sockets.findIndex((sock) => sock.title == propName);
    if (idx > -1) this.sockets.splice(idx, 1);
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
