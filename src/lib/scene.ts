// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { Designer } from "@/lib/designer";
import {
  NodeGraphicsItem,
  NodeGraphicsItemRenderState,
} from "@/lib/scene/nodegraphicsitem";
import { ConnectionGraphicsItem } from "@/lib/scene/connectiongraphicsitem";
import {
  SocketGraphicsItem,
  SocketInOut,
  ValidateConnection,
} from "@/lib/scene/socketgraphicsitem";
import {
  GraphicsItem,
  MouseMoveEvent,
  MouseDownEvent,
  MouseUpEvent,
  MouseOverEvent,
  WidgetEvent,
} from "@/lib/scene/graphicsitem";

import { SceneView } from "@/lib/scene/view";
import { FrameGraphicsItem } from "@/lib/scene/framegraphicsitem";
import { Transform2dWidget } from "@/lib/scene/Transform2dWidget";
import { CommentGraphicsItem } from "@/lib/scene/commentgraphicsitem";
import { NavigationGraphicsItem } from "@/lib/scene/navigationgraphicsitem";
import { SelectionGraphicsItem } from "@/lib/scene/selectiongraphicsitem";
import { Color } from "@/lib/designer/color";
import { Vector2 } from "@math.gl/core";
import { BoundingBox } from "@/lib/math/boundingbox";
import { Rect } from "@/lib/math/rect";
import { Editor } from "@/lib/editor";

import { ApplicationSettings } from "@/settings";
import { OutputNode } from "./library/nodes/outputnode";
import { iWidget, WidgetType, implementsWidget } from "./scene/widget";
import { TransformQuadWidget } from "./scene/transformquadwidget";
import { Guid } from "./utils";
const settings = ApplicationSettings.getInstance();

enum DragMode_Scene {
  None,
  Selection,
  Nodes,
  Socket,
  Frame,
  Pin,
  Comment,
}

export class NodeScene {
  canvas: HTMLCanvasElement;
  context!: CanvasRenderingContext2D;
  gl!: WebGL2RenderingContext;
  contextExtra: any;
  hasFocus: boolean;

  // singleton widgets for scene
  widgets: Map<WidgetType, iWidget>;

  // elements that consisting a scene
  frames: FrameGraphicsItem[];
  comments: CommentGraphicsItem[];
  navigations: NavigationGraphicsItem[];
  nodes: NodeGraphicsItem[];
  conns: ConnectionGraphicsItem[];
  selection: SelectionGraphicsItem;

  dragMode: DragMode_Scene;
  selectionRect: Rect;
  draggedNode?: NodeGraphicsItem;
  //selectedNode: NodeGraphicsItem;
  hitSocket?: SocketGraphicsItem;
  hitConnection?: ConnectionGraphicsItem;
  selectedItems: GraphicsItem[];
  hitItem: GraphicsItem;

  view: SceneView;
  copyElement: HTMLInputElement;

  id: string = Guid.newGuid();

  // callbacks
  onconnectioncreated?: (item: ConnectionGraphicsItem) => void;
  onconnectiondestroyed?: (item: ConnectionGraphicsItem) => void;
  // passes null if no node is selected
  onnodeselected?: (item: NodeGraphicsItem) => void;
  oncommentselected?: (item: CommentGraphicsItem) => void;
  onframeselected?: (item: FrameGraphicsItem) => void;
  onnavigationselected?: (item: NavigationGraphicsItem) => void;
  onwidgetselected?: (item: iWidget) => void;
  oninputnodecreationattempt?: () => void;
  onoutputnodecreationattempt?: () => void;

  onnodedeleted?: (item: NodeGraphicsItem) => void;

  // called right before items get deleted
  // ideal for undo/redo
  onitemsdeleting?: (
    frames: FrameGraphicsItem[],
    comments: CommentGraphicsItem[],
    navs: NavigationGraphicsItem[],
    cons: ConnectionGraphicsItem[],
    nodes: NodeGraphicsItem[]
  ) => void;

  // called after items are deleted
  onitemsdeleted?: (
    frames: FrameGraphicsItem[],
    comments: CommentGraphicsItem[],
    navs: NavigationGraphicsItem[],
    cons: ConnectionGraphicsItem[],
    nodes: NodeGraphicsItem[]
  ) => void;

  oncopy?: (evt: ClipboardEvent) => void;
  oncut?: (evt: ClipboardEvent) => void;
  onpaste?: (evt: ClipboardEvent) => void;

  onlibrarymenu?: () => void;

  // listeners for cleanup
  _mouseMove: (evt: MouseEvent) => void;
  _mouseDown: (evt: MouseEvent) => void;
  _mouseUp: (evt: MouseEvent) => void;
  _mouseClick: (evt: MouseEvent) => void;
  _keyDown: (evt: KeyboardEvent) => void;
  _contextMenu: (evt: MouseEvent) => void;
  _copyEvent: (evt: ClipboardEvent) => void;
  _cutEvent: (evt: ClipboardEvent) => void;
  _pasteEvent: (evt: ClipboardEvent) => void;
  _widgetUpdate: (evt: WidgetEvent) => void;
  _widgetDragged: (evt: WidgetEvent) => void;
  _widgetDragStarted: (evt: WidgetEvent) => void;
  _widgetDragEnded: (evt: WidgetEvent) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
    this.gl = this.canvas.getContext("webgl2");
    this.view = new SceneView(canvas);
    this.hasFocus = false;
    this.contextExtra = this.context;

    // widgets
    this.widgets = new Map<WidgetType, iWidget>([
      [WidgetType.Transform2D, new Transform2dWidget(this.view)],
      [WidgetType.TransformQuad, new TransformQuadWidget(this.view)],
    ]);

    this.frames = new Array();
    this.comments = new Array();
    this.nodes = new Array();
    this.conns = new Array();
    this.navigations = new Array();
    this.selectionRect = new Rect();
    this.selectedItems = [];
    this.hitItem = null;
    this.dragMode = null;

    let self = this;

    this._mouseMove = function(evt: MouseEvent) {
      self.onMouseMove(evt);
    };
    canvas.addEventListener("mousemove", this._mouseMove);

    this._mouseDown = function(evt: MouseEvent) {
      self.onMouseDown(evt);
    };
    canvas.addEventListener("mousedown", this._mouseDown);

    this._mouseUp = function(evt: MouseEvent) {
      self.onMouseUp(evt);

      if (evt.target == canvas) {
        self.hasFocus = true;

        // focus copy element
        self.copyElement.focus();
        self.copyElement.select();
        console.log("focus");
      } else {
        self.hasFocus = false;
      }
    };
    canvas.addEventListener("mouseup", this._mouseUp);

    this._mouseClick = function(evt: MouseEvent) {
      if (evt.target == canvas) {
        self.hasFocus = true;
      } else {
        self.hasFocus = false;
      }
    };
    window.addEventListener("click", this._mouseClick);

    this._keyDown = function(evt: KeyboardEvent) {
      if (self.hasFocus) {
        // Delete selected nodes
        if (
          evt.key == "Delete" &&
          self.view.isMouseOverCanvas() &&
          self.selectedItems.length !== 0
        ) {
          //self.deleteNode(self.selectedNode);
          self.deleteItems(self.selectedItems);
        }

        // Zoom selected
        if (evt.key.toLowerCase() === "f" && self.view.isMouseOverCanvas()) {
          if (self.selectedItems.length !== 0) {
            self.zoomSelected(self.selectedItems);
          } else {
            self.view.reset();
          }
        }

        // Select all nodes
        if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === "a") {
          self.selectedItems = self.nodes;
        }
      }

      // Library menu
      if (
        evt.key == " " &&
        // self.hasFocus &&
        self.view.isMouseOverCanvas()
      ) {
        if (self.onlibrarymenu != null && self.hitItem == null) {
          self.hasFocus = false;
          self.onlibrarymenu();
        }
      }

      console.log(evt.key.length);
    };
    window.addEventListener("keydown", this._keyDown, true);
    // canvas.addEventListener("mousewheel", function(evt: WheelEvent) {
    //   self.onMouseScroll(evt);
    // });
    this._contextMenu = function(evt: MouseEvent) {
      evt.preventDefault();
    };
    canvas.addEventListener("contextmenu", this._contextMenu);

    this._copyEvent = (evt) => {
      if (self.hasFocus && evt.target == self.copyElement) {
        // alert("copying selection");
        console.log(evt.target);
        evt.preventDefault();

        self.onCopy(evt);
      }
    };
    document.addEventListener("copy", this._copyEvent);

    this._cutEvent = (evt) => {
      if (self.hasFocus && evt.target == self.copyElement) {
        // alert("cutting selection");
        console.log(evt.target);
        evt.preventDefault();

        self.onCut(evt);
        self.deleteItems(this.selectedItems);
      }
    };
    document.addEventListener("cut", this._cutEvent);

    this._pasteEvent = (evt) => {
      if (self.hasFocus && evt.target == self.copyElement) {
        // alert("pasting selection");
        // console.log(evt.target);
        // console.log(evt.clipboardData);
        evt.preventDefault();
        self.copyElement.value = " ";

        self.onPaste(evt);
        console.log(self);
      }
    };
    document.addEventListener("paste", this._pasteEvent);

    this._widgetUpdate = function(evt: WidgetEvent) {
      for (const key of self.widgets.keys()) {
        const widget = self.widgets.get(key);
        if (!widget) continue;
        if (key == evt.detail.widget) {
          widget.onWidgetUpdated(evt);
        } else {
          // disable widgets other than target
          const disableEvent = new WidgetEvent("widgetUpdate", {
            detail: {
              enable: false,
              widget: key,
            },
          });
          widget.onWidgetUpdated(disableEvent);
        }
      }
    };
    document.addEventListener("widgetUpdate", this._widgetUpdate);

    this._widgetDragged = function(evt: WidgetEvent) {
      const node = Editor.getInstance().selectedNode;

      // TODO: Complete this condition
      if (node && node.onWidgetDragged) {
        node.onWidgetDragged(evt);
      }
    };
    document.addEventListener("widgetDragged", this._widgetDragged);

    this._widgetDragStarted = function(evt: WidgetEvent) {
      const node = Editor.getInstance().selectedNode;

      // TODO: Complete this condition
      if (node && node.onWidgetDragStarted) {
        node.onWidgetDragStarted(evt);
      }
    };
    document.addEventListener("widgetDragStarted", this._widgetDragStarted);

    this._widgetDragEnded = function(evt: WidgetEvent) {
      const node = Editor.getInstance().selectedNode;

      // TODO: Complete this condition
      if (node && node.onWidgetDragEnded) {
        node.onWidgetDragEnded(evt);
      }
    };
    document.addEventListener("widgetDragEnded", this._widgetDragEnded);

    this.copyElement = document.createElement("input");
    this.copyElement.value = " ";
    this.copyElement.style.opacity = "0";
    this.copyElement.style.width = "0px";
    this.copyElement.style.height = "0px";
    this.copyElement.style.margin = "0px";
    this.copyElement.style.padding = "0px";
    document.getElementById("editor-view").appendChild(this.copyElement);
  }

  get inputNode(): GraphicsItem {
    let input = this.frames[0];
    return input;
  }

  get outputNode(): NodeGraphicsItem {
    let output = this.nodes.find((item) => item.dNode instanceof OutputNode);
    return output;
  }

  dispose() {
    this.canvas.removeEventListener("mousemove", this._mouseMove);
    this.canvas.removeEventListener("mouedown", this._mouseDown);
    this.canvas.removeEventListener("mouseup", this._mouseUp);
    this.canvas.removeEventListener("contextmenu", this._contextMenu);
    window.removeEventListener("click", this._mouseClick);
    window.removeEventListener("keydown", this._keyDown);
    document.removeEventListener("copy", this._copyEvent);
    document.removeEventListener("cut", this._cutEvent);
    document.removeEventListener("paste", this._pasteEvent);
    document.removeEventListener("widgetUpdate", this._widgetUpdate);
    document.removeEventListener("widgetDragged", this._widgetDragged);
    document.removeEventListener("widgetDragStarted", this._widgetDragStarted);
    document.removeEventListener("widgetDragEnded", this._widgetDragEnded);

    this.frames = [];
    this.comments = [];
    this.nodes = [];
    this.conns = [];
    this.navigations = [];
    this.selectedItems = [];
    this.hitItem = null;
  }

  setSelectedItems(items: GraphicsItem[], createSelection: boolean = false) {
    let item = null;
    if (items.length == 1) {
      item = items[0];
      const designer = Editor.getDesigner();
      const selctedNode = designer.nodes.find((node) => node.id === item.id);
      Editor.getInstance().onnodeselected(selctedNode);
    }

    this.selectedItems = items;

    // create actual selection object to encapsulate items
    if (createSelection == true) {
      let sel: SelectionGraphicsItem = new SelectionGraphicsItem(
        this,
        this.view
      );
      sel.setHitItems(items);
      this.selection = sel;
    }
  }

  // no callbacks are made here
  addNode(item: NodeGraphicsItem) {
    this.nodes.push(item);

    // needed for sockets to get scene instance
    item.setScene(this);
  }

  addComment(item: CommentGraphicsItem) {
    item.setScene(this);
    this.comments.push(item);
  }

  removeComment(item: CommentGraphicsItem) {
    //todo: remove from selection
    let i = this.comments.indexOf(item);
    if (i !== -1) this.comments.splice(i, 1);

    // emit deselection
    if (this.onnodeselected) this.onnodeselected(null);
    this.selectedItems = [];
  }

  addFrame(item: FrameGraphicsItem) {
    item.setScene(this);
    this.frames.push(item);
  }

  removeFrame(item: FrameGraphicsItem) {
    //todo: remove from selection
    let i = this.frames.indexOf(item);
    if (i !== -1) this.frames.splice(i, 1);
  }

  addNavigation(nav: NavigationGraphicsItem) {
    nav.setScene(this);
    this.navigations.push(nav);
  }

  removeNavigation(item: NavigationGraphicsItem) {
    //todo: remove from selection
    let i = this.navigations.indexOf(item);
    if (i !== -1) this.navigations.splice(i, 1);
  }

  removeAssociatedConnections(item: NodeGraphicsItem, propName: string) {
    // delete connections
    let toRemove = this.conns.filter(
      (con) =>
        (con.socketA &&
          con.socketA.node.id == item.id &&
          con.socketA.id == propName) ||
        (con.socketB &&
          con.socketB.node.id == item.id &&
          con.socketB.id == propName)
    );

    for (let con of toRemove) {
      this.removeConnection(con);
    }

    toRemove = [];
  }

  deleteNode(item: NodeGraphicsItem) {
    // delete connections
    let toRemove = this.conns.filter(
      (con) =>
        (con.socketA && con.socketA.node.id == item.id) ||
        (con.socketB && con.socketB.node.id == item.id)
    );

    for (let con of toRemove) {
      this.removeConnection(con);
    }

    toRemove = [];

    // for (let i = this.conns.length - 1; i >= 0; i--) {
    //   let con = this.conns[i];
    //   if (
    //     (con.socketA && con.socketA.node.id == item.id) ||
    //     (con.socketB && con.socketB.node.id == item.id)
    //   ) {
    //     this.removeConnection(con);
    //   }
    // }

    if (item.enable) {
      let widgetType = item.dNode ? item.dNode.widgetType : WidgetType.None;

      const event = new WidgetEvent("widgetUpdate", {
        detail: {
          enable: false,
          widget: widgetType,
        },
      });
      document.dispatchEvent(event);
    }

    // remove node from list
    this.nodes.splice(this.nodes.indexOf(item), 1);

    // if node is selected (which it most likely is), clear it from selection
    // this.selectedNode = null;

    // emit deselection
    if (this.onnodeselected) this.onnodeselected(null);

    // emit remove event
    if (this.onnodedeleted) this.onnodedeleted(item);
  }

  // called by delete or cut event
  deleteItems(items: GraphicsItem[]) {
    // 1 - put items in buckets
    let frames: FrameGraphicsItem[] = [];
    let comments: CommentGraphicsItem[] = [];
    let navs: NavigationGraphicsItem[] = [];
    let cons: ConnectionGraphicsItem[] = [];
    let nodes: NodeGraphicsItem[] = [];

    for (let item of items) {
      if (item instanceof FrameGraphicsItem) {
        // input graphic item is not deleteable
        // frames.push(<FrameGraphicsItem>item);
      }
      if (item instanceof CommentGraphicsItem) {
        comments.push(<CommentGraphicsItem>item);
      }
      if (item instanceof NavigationGraphicsItem) {
        navs.push(<NavigationGraphicsItem>item);
      }
      if (item instanceof NodeGraphicsItem) {
        if (!item.isOutput) nodes.push(<NodeGraphicsItem>item);
      }
    }

    // if nothing was deleted then return
    if (
      frames.length == 0 &&
      comments.length == 0 &&
      navs.length == 0 &&
      nodes.length == 0
    )
      return;

    // 2 - gather affected connections
    let conDict = new Map<string, ConnectionGraphicsItem>();
    for (let node of nodes) {
      // add all connections to map
      for (let sock of node.sockets) {
        for (let con of sock.conns) {
          conDict.set(con.id, con);
        }
      }
    }
    for (const [key, con] of conDict) cons.push(con);

    // 3 - actual deletion
    if (this.onitemsdeleting) {
      this.onitemsdeleting(frames, comments, navs, cons, nodes);
    }

    for (let frame of frames) this.removeFrame(frame);
    for (let comment of comments) this.removeComment(comment);
    for (let nav of navs) this.removeNavigation(nav);
    for (let node of nodes) this.deleteNode(node);

    // 4 - callback
    if (this.onitemsdeleted) {
      this.onitemsdeleted(frames, comments, navs, cons, nodes);
    }
  }

  zoomSelected(selectedItems: GraphicsItem[]) {
    if (selectedItems.length == 0) return;

    // TODO: move it to utility library
    let getSelectedBounds = (selectedItems: GraphicsItem[]): BoundingBox => {
      let box = BoundingBox.fromRect(selectedItems[0].getRect());
      for (let item of selectedItems) {
        const boxThisItem = BoundingBox.fromRect(item.getRect());
        box = BoundingBox.merge(box, boxThisItem);
      }
      return box;
    };

    const box = getSelectedBounds(selectedItems);
    this.view.zoomToBoundingBox(box);
  }

  getNodeById(id: string): NodeGraphicsItem {
    for (let node of this.nodes) {
      if (node.id == id) return node;
    }
    return null;
  }

  refresh() {
    // no connections
    if (this.conns.length < 1) return;
    if (!this.onconnectioncreated) return;

    const designer = Editor.getDesigner();
    if (!designer) return;

    designer.conns.forEach((con) => {
      const leftNode = con.leftNode;
      const rightNode = con.rightNode;

      if (rightNode.onResized) {
        rightNode.onResized();
      }

      // if (rightNode.isParentIndex(leftNode.id)) {
      //   const needToUpdate =
      //     leftNode.getWidth() != rightNode.getWidth() ||
      //     leftNode.getHeight() != rightNode.getHeight();
      //   if (needToUpdate) {
      //     rightNode.connected(leftNode, rightNode.id);
      //   }
      // }
      //rightNode.connected(leftNode, rightNode.id);
    });
  }

  isCausingCycle(con: ConnectionGraphicsItem) {
    const leftNode = con.outNode;
    const rightNode = con.inNode;
    if (!leftNode || !rightNode) {
      console.warn("invalid connection item detected");
      return true;
    }

    let self = this;
    let traverse = function(node: NodeGraphicsItem, id: string) {
      const nextConns = self.conns.filter((conn) => conn.outNode.id == node.id);

      for (const nextCon of nextConns) {
        let found = traverse(nextCon.inNode, id);
        if (found) return true;
        if (nextCon.inNode.id == id) return true;
      }

      return false;
    };

    return traverse(rightNode, leftNode.id);
  }

  //todo: integrity check
  addConnection(con: ConnectionGraphicsItem): boolean {
    if (this.isCausingCycle(con)) {
      console.log("You are trying to make cyclic connection, abort.");
      return false;
    } else {
      this.conns.push(con);

      // link the sockets
      con.socketA.addConnection(con);
      con.socketB.addConnection(con);

      // callback
      if (this.onconnectioncreated) this.onconnectioncreated(con);
      return true;
    }
  }

  createConnection(leftId: string, rightId: string, rightIndex: number = 0) {
    let con = new ConnectionGraphicsItem();

    // get nodes
    let leftNode = this.getNodeById(leftId);
    let rightNode = this.getNodeById(rightId);

    // get sockets
    con.socketA = leftNode.sockets.find(
      (x) => x.socketInOut == SocketInOut.Out
    );
    con.socketB = rightNode.sockets[rightIndex];

    if (ValidateConnection(con.socketA, con.socketB)) {
      this.addConnection(con);
    } else {
      console.warn("invalid connection detected, please check socket type");
    }
  }

  removeConnection(con: ConnectionGraphicsItem) {
    this.conns.splice(this.conns.indexOf(con), 1);
    //con.socketA.con = null;
    //con.socketB.con = null;
    con.socketA.removeConnection(con);
    con.socketB.removeConnection(con);

    // callback
    if (this.onconnectiondestroyed) this.onconnectiondestroyed(con);
  }

  // if the user click drags on a socket then it's making a connection
  drawActiveConnection() {
    let mouse = this.view.getMouseSceneSpace();
    let mouseX = mouse.x;
    let mouseY = mouse.y;

    let ctx = this.context;
    if (this.hitSocket) {
      ctx.beginPath();
      ctx.strokeStyle = "rgb(200, 200, 200)";
      ctx.lineWidth = 4;
      ctx.moveTo(this.hitSocket.centerX(), this.hitSocket.centerY());

      if (this.hitSocket.socketInOut == SocketInOut.Out) {
        ctx.bezierCurveTo(
          this.hitSocket.centerX() + 60,
          this.hitSocket.centerY(), // control point 1
          mouseX - 60,
          mouseY,
          mouseX,
          mouseY
        );
      } else {
        ctx.bezierCurveTo(
          this.hitSocket.centerX() - 60,
          this.hitSocket.centerY(), // control point 1
          mouseX + 60,
          mouseY,
          mouseX,
          mouseY
        );
      }

      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.fillStyle = "rgb(200, 200, 200)";
      const radius = 6;
      ctx.arc(mouseX, mouseY, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  clearAndDrawGrid() {
    // todo: draw grid
    this.view.clear(this.context, settings.colorGridBackground);
    this.view.setViewMatrix(this.context);

    if (this.view.zoomFactor > 0.01) {
      this.view.drawGrid(this.context, 100, settings.colorGridPrimary, 3);
    }
    if (this.view.zoomFactor > 0.2) {
      this.view.drawGrid(this.context, 25, settings.colorGridSecondary, 1);
    }
    this.view.drawCheckerBoard(
      this.gl,
      settings.colorGridPrimary,
      settings.colorGridSecondary,
      32
    );
  }

  draw() {
    this.clearAndDrawGrid();

    // draw frames
    for (let frame of this.frames) frame.draw(this.context);

    // draw comments
    for (let comment of this.comments) comment.draw(this.context);

    // draw connections
    for (let con of this.conns) {
      if (con == this.hitConnection) continue;
      con.draw(this.context);
    }

    if (this.hitSocket) {
      this.drawActiveConnection();
    }

    // draw nodes
    let mouse = this.view.getMouseSceneSpace();
    let mouseX = mouse.x;
    let mouseY = mouse.y;
    let nodeState: NodeGraphicsItemRenderState = {
      hovered: false, // mouse over
      selected: false, // selected node
    };

    // draw selection rects under node
    if (this.selectedItems.length > 0) {
      this.drawSelectedItems(this.selectedItems, this.context);
    }

    for (let item of this.nodes) {
      // check for selection ( only do this when not dragging anything )
      //if (item == this.selectedNode) nodeState.selected = true;
      //else nodeState.selected = false;

      // check for hover
      if (item.isPointInside(mouseX, mouseY) && this.hitSocket == null)
        nodeState.hovered = true;
      else nodeState.hovered = false;

      item.draw(this.context, nodeState);
    }

    for (let nav of this.navigations) nav.draw(this.context);

    if (this.selection) this.selection.draw(this.context);

    // widgets
    for (const widget of this.widgets.values()) {
      widget.draw(this.context, null);
    }
  }

  // TODO: setup color palette
  // https://colorhunt.co/palette/196113
  // https://www.rapidtables.com/convert/color/hex-to-rgb.html
  drawSelectedItems(items: GraphicsItem[], ctx: CanvasRenderingContext2D) {
    for (let item of items) {
      if (!item.drawSelHighlight) continue;
      ctx.beginPath();
      //this.roundRect(ctx, this.x, this.y, width, height, 1);
      // ctx.rect(item.left, item.top, item.getWidth(), item.getHeight());
      let rect = item.getRect();
      rect.expand(15);

      //ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillStyle = settings.colorSelectedItemBackground;
      ctx.lineWidth = 0;
      ctx.rect(rect.left, rect.top, rect.width, rect.height);
      ctx.fill();

      ctx.strokeStyle = "rgba(187, 225, 250)";
      ctx.lineWidth = 3;
      ctx.rect(rect.left, rect.top, rect.width, rect.height);

      ctx.stroke();
    }
  }

  onCopy(evt: ClipboardEvent) {
    // todo: copy selected items to clipboard
    //ItemClipboard.copyItems(this, evt.clipboardData);
    if (this.oncopy) this.oncopy(evt);
  }

  onCut(evt: ClipboardEvent) {
    // todo: copy selected items to clipboard
    //ItemClipboard.copyItems(this, evt.clipboardData);
    if (this.oncut) this.oncut(evt);
  }

  onPaste(evt: ClipboardEvent) {
    // todo: paste items from clipboard
    //ItemClipboard.pasteItems(this, evt.clipboardData);
    if (this.onpaste) this.onpaste(evt);
  }

  // mouse events
  onMouseDown(evt: MouseEvent) {
    //todo: look at double event calling
    let pos = this.getScenePos(evt);
    let mouseX = pos.x;
    let mouseY = pos.y;

    if (evt.button == 0) {
      let hitItem = this.getHitItem(mouseX, mouseY);
      let mouseEvent = new MouseDownEvent();
      mouseEvent.globalX = pos.x;
      mouseEvent.globalY = pos.y;
      mouseEvent.shiftKey = evt.shiftKey;
      mouseEvent.altKey = evt.altKey;
      mouseEvent.ctrlKey = evt.ctrlKey;

      if (hitItem != null) {
        mouseEvent.localX = hitItem.left - pos.x;
        mouseEvent.localY = hitItem.top - pos.y;

        hitItem.mouseDown(mouseEvent);
        if (mouseEvent.isAccepted) {
          this.hitItem = hitItem;

          //console.log(hitItem);
          if (hitItem instanceof NodeGraphicsItem) {
            let hitNode = <NodeGraphicsItem>hitItem;
            //move node to stop of stack
            this.moveNodeToTop(hitNode);

            if (this.onnodeselected) {
              this.onnodeselected(hitNode);
            }
          }

          //todo: look at double event calling for comments
          if (hitItem instanceof CommentGraphicsItem) {
            let hitComment = <CommentGraphicsItem>hitItem;

            if (this.oncommentselected) {
              if (hitComment) this.oncommentselected(hitComment);
              else this.oncommentselected(hitComment);
            }
          }

          if (hitItem instanceof FrameGraphicsItem) {
            let hit = <FrameGraphicsItem>hitItem;

            if (this.onframeselected) {
              if (hit) this.onframeselected(hit);
              else this.onframeselected(hit);
            }
          }

          if (implementsWidget(hitItem)) {
            let hit = (<unknown>hitItem) as iWidget;

            if (this.onwidgetselected) {
              if (hit) this.onwidgetselected(hit);
              else this.onwidgetselected(hit);
            }
          }

          if (hitItem instanceof NavigationGraphicsItem) {
            let hit = <NavigationGraphicsItem>hitItem;

            if (this.onnavigationselected) {
              if (hit) this.onnavigationselected(hit);
              else this.onnavigationselected(hit);
            }
          }

          // selection graphics item can never be *selected*
          if (
            !(hitItem instanceof SelectionGraphicsItem) &&
            !(hitItem instanceof SocketGraphicsItem)
          )
            this.selectedItems = [hitItem];
        }
      } else {
        let hitItem = new SelectionGraphicsItem(this, this.view);
        mouseEvent.localX = hitItem.left - pos.x;
        mouseEvent.localY = hitItem.top - pos.y;
        hitItem.mouseDown(mouseEvent);

        this.selection = hitItem;
        this.hitItem = hitItem;

        Editor.getInstance().onnodeselected(null);
      }
    }
  }

  // https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
  moveNodeToTop(node: NodeGraphicsItem) {
    let index = this.nodes.indexOf(node);
    if (index === -1) {
      console.log("Attempting to push node that doesnt exist in node list");
    }
    this.nodes.splice(index, 1);
    this.nodes.push(node);
  }

  onMouseUp(evt: MouseEvent) {
    let pos = this.getScenePos(evt);
    let mouseX = pos.x;
    let mouseY = pos.y;

    if (evt.button == 0) {
      if (this.hitItem != null) {
        let hitItem = this.hitItem;

        let mouseEvent = new MouseUpEvent();
        mouseEvent.globalX = pos.x;
        mouseEvent.globalY = pos.y;
        mouseEvent.localX = hitItem.left - pos.x;
        mouseEvent.localY = hitItem.top - pos.y;
        mouseEvent.shiftKey = evt.shiftKey;
        mouseEvent.altKey = evt.altKey;
        mouseEvent.ctrlKey = evt.ctrlKey;

        hitItem.mouseUp(mouseEvent);

        const isClearingSelection = hitItem instanceof SelectionGraphicsItem;
        if (isClearingSelection) {
          // for (const widget of this.widgets.values()) {
          //   widget.setEnable(false);
          // }

          for (const key of this.widgets.keys()) {
            const disableEvent = new WidgetEvent("widgetUpdate", {
              detail: {
                enable: false,
                widget: key,
              },
            });
            document.dispatchEvent(disableEvent);
          }
          // if (document) {
          //   const event = new WidgetEvent("widgetUpdate", {
          //     detail: {
          //       enable: false,
          //       widget: WidgetType.None,
          //     },
          //   });

          //   document.dispatchEvent(event);
          // }
        }

        this.hitItem = null;
      }
    }
  }

  onMouseMove(evt: MouseEvent) {
    let pos = this.getScenePos(evt);

    if (this.hitItem) {
      let mouseEvent = new MouseMoveEvent();
      mouseEvent.globalX = pos.x;
      mouseEvent.globalY = pos.y;

      mouseEvent.localX = this.hitItem.left - pos.x;
      mouseEvent.localY = this.hitItem.top - pos.y;

      mouseEvent.shiftKey = evt.shiftKey;
      mouseEvent.altKey = evt.altKey;
      mouseEvent.ctrlKey = evt.ctrlKey;

      let drag = this.view.getMouseDeltaSceneSpace();
      mouseEvent.deltaX = drag.x;
      mouseEvent.deltaY = drag.y;

      this.hitItem.mouseMove(mouseEvent);
    } else {
      // do mouse over
      let hitItem = this.getHitItem(pos.x, pos.y);
      if (hitItem) {
        let mouseEvent = new MouseOverEvent();
        mouseEvent.globalX = pos.x;
        mouseEvent.globalY = pos.y;

        mouseEvent.localX = hitItem.left - pos.x;
        mouseEvent.localY = hitItem.top - pos.y;

        mouseEvent.shiftKey = evt.shiftKey;
        mouseEvent.altKey = evt.altKey;
        mouseEvent.ctrlKey = evt.ctrlKey;

        hitItem.mouseOver(mouseEvent);
      } else {
        // reset pointer
        this.view.canvas.style.cursor = "default";
      }
    }

    // // handle dragged socket
    // if (this.hitSocket) {
    // }

    // // handle dragged node
    // if (this.draggedNode != null) {
    // 	//let diff = this.view.canvasToSceneXY(evt.movementX, evt.movementY);
    // 	//console.log("move: ",evt.movementX,evt.movementY);
    // 	//this.draggedNode.move(evt.movementX, evt.movementY);

    // 	// view keeps track of dragging
    // 	let drag = this.view.getMouseDeltaSceneSpace();
    // 	this.draggedNode.move(drag.x, drag.y);
    // }
  }

  // hit detection
  // x and y are scene space
  getHitNode(x: number, y: number): NodeGraphicsItem {
    // for (let node of this.nodes) {
    for (let index = this.nodes.length - 1; index >= 0; index--) {
      let node = this.nodes[index];
      if (node.isPointInside(x, y)) return node;
    }

    return null;
  }

  getHitSocket(x: number, y: number): SocketGraphicsItem {
    for (let node of this.nodes) {
      for (let sock of node.sockets) {
        if (sock.isPointInside(x, y)) return sock;
      }
    }

    return null;
  }

  // gets item over mouse x and y
  // obeys precedence
  getHitItem(x: number, y: number): GraphicsItem {
    let hitItem = this._getHitItem(x, y);

    // if item is in selection then return whole selection
    if (
      hitItem != null &&
      this.isItemSelected(hitItem) &&
      this.selection != null
    ) {
      if (this.selection.isPointInside(x, y)) return this.selection;
    }

    return hitItem;
  }

  _getHitItem(x: number, y: number): GraphicsItem {
    // 0) widget
    for (const widget of this.widgets.values()) {
      if (widget.isPointInside(x, y) && widget.isEnabled()) {
        // TODO: check it safe.
        return (<unknown>widget) as GraphicsItem;
      }
    }

    // 1) navigation pins
    for (let index = this.navigations.length - 1; index >= 0; index--) {
      let nav = this.navigations[index];

      if (nav.isPointInside(x, y)) return nav;
    }

    // 2) nodes and their sockets
    for (let index = this.nodes.length - 1; index >= 0; index--) {
      let node = this.nodes[index];

      for (let sock of node.sockets) {
        if (sock.isPointInside(x, y)) return sock;
      }

      if (node.isPointInside(x, y)) return node;
    }

    // 3) comments
    for (let index = this.comments.length - 1; index >= 0; index--) {
      let comment = this.comments[index];

      if (comment.isPointInside(x, y)) return comment;
    }

    // 4) frame
    for (let index = this.frames.length - 1; index >= 0; index--) {
      let frame = this.frames[index];

      if (frame.isPointInside(x, y)) return frame;
    }

    return null;
  }

  isItemSelected(hitItem): boolean {
    // todo: use dictionary
    for (let item of this.selectedItems) if (item == hitItem) return true;
    return false;
  }

  // UTILITY

  // returns the scene pos from the mouse event
  getScenePos(evt: MouseEvent): Vector2 {
    let canvasPos = _getMousePos(this.canvas, evt);
    return this.view.canvasToSceneXY(canvasPos.x, canvasPos.y);
  }

  // SAVE/LOAD

  // only save position data to associative array
  save(): any {
    let data: any = {};

    // NODES
    let nodes = {};
    for (let node of this.nodes) {
      let n: any = {};
      n["id"] = node.id;
      n["x"] = node.left;
      n["y"] = node.top;
      n["w"] = node.getWidth();
      n["h"] = node.getHeight();

      nodes[node.id] = n;
    }
    data["nodes"] = nodes;

    // FRAMES
    let frames = [];
    for (let frame of this.frames) {
      let n: any = {};
      n["x"] = frame.left;
      n["y"] = frame.top;
      n["width"] = frame.getWidth();
      n["height"] = frame.getHeight();
      n["color"] = frame.fillColor.toHex();
      frames.push(n);
    }
    data["frames"] = frames;

    // COMMENTS
    let comments = [];
    for (let comment of this.comments) {
      let n: any = {};
      n["x"] = comment.left;
      n["y"] = comment.top;
      n["text"] = comment.text;
      n["color"] = comment.color.toHex();
      comments.push(n);
    }
    data["comments"] = comments;

    // NAVIGATIONS
    let navs = [];
    for (let nav of this.navigations) {
      let n: any = {};
      n["x"] = nav.left;
      n["y"] = nav.top;
      navs.push(n);
    }
    data["navigations"] = navs;

    return data;
  }

  static load(
    designer: Designer,
    data: any,
    canvas: HTMLCanvasElement
  ): NodeScene {
    let s = new NodeScene(canvas);

    // add nodes one by one
    for (let dNode of designer.nodes) {
      // create node from designer
      let node = new NodeGraphicsItem(dNode);
      const nodeData = data["nodes"][node.id];
      s.addNode(node);

      node.setCenter(
        nodeData.x + node.getWidth() / 2,
        nodeData.y + node.getHeight() / 2
      );
    }

    // add connection one by one
    for (let dcon of designer.conns) {
      let con = new ConnectionGraphicsItem();
      con.id = dcon.id;

      // get nodes
      let leftNode = s.getNodeById(dcon.leftNode.id);
      let rightNode = s.getNodeById(dcon.rightNode.id);

      // get sockets
      con.socketA = leftNode.getOutSocketByName(dcon.leftNodeOutput);
      con.socketB = rightNode.getInSocketByName(dcon.rightNodeInput);

      s.addConnection(con);
    }

    //todo: integrity checks
    // FRAMES
    if (data.frames) {
      for (let d of data.frames) {
        let frame = new FrameGraphicsItem(s.view);
        frame.setPos(d.x, d.y);
        frame.setSize(d.width, d.height);

        frame.fillColor = Color.parse(d.color);

        s.addFrame(frame);
      }
    }

    // COMMENTS
    if (data.comments) {
      for (let d of data.comments) {
        let comment = new CommentGraphicsItem(s.view);
        comment.setPos(d.x, d.y);
        comment.setText(d.text);
        comment.color = Color.parse(d.color);

        s.addComment(comment);
      }
    }

    // NAVIGATION
    if (data.navigations) {
      for (let d of data.navigations) {
        let nav = new NavigationGraphicsItem();
        nav.setPos(d.x, d.y);
        s.addNavigation(nav);
      }
    }

    return s;
  }
}

// https://www.html5canvastutorials.com/advanced/html5-canvas-mouse-coordinates/
// https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
function _getMousePos(canvas, evt) {
  let rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top,
  };
}
