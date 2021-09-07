// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import fs from "fs";
import path from "path";
import store from "../store";

import { Designer } from "./designer";
import { DesignerNode } from "./designer/designernode";
import { Property, PropertyType } from "./designer/properties";
import { Guid } from "./utils";
import { DesignerVariableType } from "./designer/designervariable";
import { DesignerLibrary } from "./designer/library";
import { NodeScene } from "./scene";
import { ConnectionGraphicsItem } from "./scene/connectiongraphicsitem";
import { NodeGraphicsItem } from "./scene/nodegraphicsitem";

import {
  LocalItemData,
  ProjectItemData,
  WorkshopItemData,
} from "@/community/ProjectItemData";
import { createLibrary, getCurrentLibraryVersion } from "@/lib/library/library";
import { Color } from "./designer/color";
import { CommentGraphicsItem } from "./scene/commentgraphicsitem";
import { FrameGraphicsItem } from "./scene/framegraphicsitem";
import { iWidget } from "@/lib/scene/widget";
import { NavigationGraphicsItem } from "./scene/navigationgraphicsitem";
import { ItemClipboard } from "./clipboard";
import { UndoStack } from "./undostack";
import { AddItemsAction } from "./actions/additemsaction";
import { RemoveItemsAction } from "./actions/removeitemsaction";
import { DetectNode } from "./library/nodes/detectnode";
import { ImageDesignerNode } from "./designer/imagedesignernode";
import { plainToClass } from "class-transformer";

const isDataUri = require("is-data-uri");

function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export enum FileType {
  Texture,
  LUT,
  Animation,
}

export class Editor {
  private static instance: Editor;

  canvas: HTMLCanvasElement;

  library: DesignerLibrary;
  nodeScene: NodeScene;
  designer: Designer;
  selectedNodeId: string;

  undoStack: UndoStack;

  preview2D: HTMLCanvasElement;
  preview2DCtx: CanvasRenderingContext2D;

  onnodeselected?: (item: DesignerNode) => void;
  oncommentselected?: (item: CommentGraphicsItem) => void;
  onframeselected?: (item: FrameGraphicsItem) => void;
  onwidgetselected?: (item: iWidget) => void;
  onnavigationselected?: (item: NavigationGraphicsItem) => void;
  onpreviewnode?: (item: DesignerNode, image: HTMLCanvasElement) => void;
  onlibrarymenu?: () => void;

  constructor() {
    Editor.instance = this;
    DetectNode.loadModelAsync();
    this.selectedNodeId = "";
    this.undoStack = new UndoStack();
    UndoStack.current = this.undoStack;
    store.state.undoStack = UndoStack.current;
  }

  static getInstance() {
    if (!Editor.instance) {
      Editor.instance = new Editor();
    }
    return Editor.instance;
  }

  static getMetadata() {
    return store.state.metadata;
  }

  static getDesigner() {
    const editor = this.getInstance();
    return editor.designer;
  }

  static getScene() {
    const editor = this.getInstance();
    return editor.nodeScene;
  }

  get selectedNode(): DesignerNode {
    if (this.selectedNodeId != "") {
      return this.designer.getNodeById(this.selectedNodeId);
    } else {
      console.warn("tried to find node with empty id");
      return null;
    }
  }

  refreshWidget() {
    const selectedNode = this.designer.getNodeById(this.selectedNodeId);
    let xf = selectedNode as any;
    if (xf && xf.requestUpdateWidget) xf.requestUpdateWidget();
  }

  getInputItem() {
    const item = this.nodeScene.frames[0];
    return item;
  }

  getImageWidth() {
    return this.designer.width;
  }

  getImageHeight() {
    return this.designer.height;
  }

  undo() {
    this.undoStack.undo();
  }

  redo() {
    this.undoStack.redo();
  }

  // create empty scene
  createEmptyScene() {
    this.library = createLibrary();
    this.setMetadata(ProjectItemData.fromNothing());
    this.setDesigner(new Designer());
    this.setScene(new NodeScene(this.canvas));

    // refresh everything
    this.designer.invalidateAllNodes();
    const centerX = 0;
    const centerY = 0;

    // input bundle
    let inputBundle = this.createFrame();
    inputBundle.setCenter(centerX - 400, centerY);

    // input
    let inputNode = this.library.create("color");
    //inputNode.setAsInput();
    let inputNodeView = this.addNode(inputNode, 0, 0);
    inputNodeView.setCenter(centerX - 150, centerY);

    // output
    let node = this.library.create("output");
    //node.setAsResult();
    let nodeView = this.addNode(node, 0, 0);
    nodeView.setCenter(centerX + 150, centerY);
    (node as ImageDesignerNode).setAsOutput();

    this.nodeScene.view.reset();

    // connection
    this.nodeScene.createConnection(inputNode.id, node.id, 0);

    // setup properties
    inputNode.setProperty("color", new Color(1, 1, 1, 1));

    const dnode = this.designer.getNodeById(node.id);
    const graphNode = this.nodeScene.getNodeById(dnode.id);
    // todo: move to double click
    if (this.onpreviewnode) {
      this.onpreviewnode(dnode, graphNode.imageCanvas.canvas);
    }
  }

  set2DPreview(preview2D: HTMLCanvasElement) {
    this.preview2D = preview2D;
    this.preview2DCtx = preview2D.getContext("2d");
  }

  setSceneCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  setMetadata(data: ProjectItemData) {
    store.state.metadata = data;
  }

  setDesigner(designer: Designer) {
    this.designer = designer;
    let self = this;

    designer.onnodetextureupdated = function(dnode) {
      let graphNode = self.nodeScene.getNodeById(dnode.id);
      if (!graphNode) return; // node could have been deleted

      // something worng with fbo setup around here.
      self.designer.copyNodeTextureToImageCanvas(dnode, graphNode.imageCanvas);
    };
  }

  setScene(scene: NodeScene) {
    // cleanup previous graph
    if (this.nodeScene) this.nodeScene.dispose();
    this.nodeScene = scene;

    if (this.undoStack) this.undoStack.reset();
    this.undoStack = new UndoStack();
    UndoStack.current = this.undoStack;
    store.state.undoStack = UndoStack.current;

    let self = this;
    this.nodeScene.onconnectioncreated = function(con: ConnectionGraphicsItem) {
      // get node from graph
      let leftNode = con.socketA.node;
      let rightNode = con.socketB.node;

      // get node from designer and connect them
      let leftDNode = self.designer.getNodeById(leftNode.id);
      let rightDNode = self.designer.getNodeById(rightNode.id);

      // make connection
      // switch from `title` to `name`
      self.designer.addConnection(leftDNode, rightDNode, con.socketB.title);
    };

    this.nodeScene.onconnectiondestroyed = function(
      con: ConnectionGraphicsItem
    ) {
      // get node from graph
      let leftNode = con.socketA.node;
      let rightNode = con.socketB.node;

      // get node from designer and connect them
      let leftDNode = self.designer.getNodeById(leftNode.id);
      let rightDNode = self.designer.getNodeById(rightNode.id);

      // remove connection
      // switch from `title` to `name`
      self.designer.removeConnection(leftDNode, rightDNode, con.socketB.title);

      // clear right node image
      rightNode.setThumbnail(null);
    };

    this.canvas.ondrop = async function(ev: DragEvent) {
      const zoomFactor = self.nodeScene.view.zoomFactor;
      const x = (ev.offsetX - self.nodeScene.view.offset[0]) / zoomFactor;
      const y = (ev.offsetY - self.nodeScene.view.offset[1]) / zoomFactor;

      let viewNodes = [];
      let nodes = [];
      let offset = [0, 0];

      let droppedHtml = ev.dataTransfer.getData("text/html");
      let itemJson = ev.dataTransfer.getData("text/plain");

      let item = null;
      try {
        item = JSON.parse(itemJson);
      } catch {}

      if (item) {
        const canv = self.canvas;
        let rect = canv.getBoundingClientRect();
        let pos = self.nodeScene.view.canvasToSceneXY(
          ev.clientX - rect.left,
          ev.clientY - rect.top
        );

        let action: AddItemsAction = null;
        if (item.type == "node") {
          let nodeName = item.name;

          let dnode = self.library.create(nodeName);
          let n = self.addNode(dnode);
          n.setCenter(pos.x, pos.y);

          action = new AddItemsAction(
            self.nodeScene,
            self.designer,
            [],
            [],
            [],
            [],
            [n],
            [dnode]
          );
        } else if (item.type == "comment") {
          let d = self.createComment();
          d.setCenter(pos.x, pos.y);

          action = new AddItemsAction(
            self.nodeScene,
            self.designer,
            [],
            [item],
            [],
            [],
            [],
            []
          );
        } else if (item.type == "frame") {
          let d = self.createFrame();
          d.setCenter(pos.x, pos.y);

          action = new AddItemsAction(
            self.nodeScene,
            self.designer,
            [item],
            [],
            [],
            [],
            [],
            []
          );
        } else if (item.type == "navigation") {
          let d = self.createNavigation();
          d.setCenter(pos.x, pos.y);

          action = new AddItemsAction(
            self.nodeScene,
            self.designer,
            [],
            [],
            [item],
            [],
            [],
            []
          );
        }

        if (action != null) {
          UndoStack.current.push(action);
        }
        console.log("drop");
      }
      // dragged from web browser
      else if (droppedHtml) {
        let dataUrl = await self.getImageUrl(droppedHtml);
        if (dataUrl) {
          const posX = offset[0] + x;
          const posY = offset[1] + y;
          let n = self.createFromUrl(dataUrl, posX, posY);
          offset = [offset[0] + 15, offset[1] + 15];
          nodes.push(n[0]);
          viewNodes.push(n[1]);
        }
      }

      const isValidImagePath = (filePath: string) => {
        let isValid = filePath.length > 0;
        if (isValid) {
          // TODO: check the path indicates proper image path
          let stats = fs.statSync(filePath);
          isValid = stats.isFile();
        }
        return isValid;
      };

      const getFileType = (filePath: string) => {
        const ext = path.extname(filePath).toLowerCase();

        if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
          return FileType.Texture;
        } else if (ext === ".webp" || ext === ".gif") {
          let isAnimation = true;
          if (isAnimation) {
            return FileType.Animation;
          } else {
            return FileType.Texture;
          }
        } else if (ext === ".cube") {
          return FileType.LUT;
        } else {
          return undefined;
        }
      };

      // dragged local files
      for (let file of ev.dataTransfer.files) {
        if (isValidImagePath(file.path)) {
          const fileType = getFileType(file.path);
          let node;
          if (fileType === FileType.Texture) {
            node = self.library.create("texture", file.path);
          } else if (fileType === FileType.Animation) {
            node = self.library.create("animation", file.path);
          } else if (fileType === FileType.LUT) {
            node = self.library.create("colorgrade", file.path);
          } else if (!fileType) {
            continue;
          }
          let nodeView = self.addNode(node, 0, 0);
          nodeView.setCenter(x + offset[0], y + offset[1]);

          nodes.push(node);
          viewNodes.push(nodeView);

          offset = [offset[0] + 15, offset[1] + 15];
        }
      }

      if (nodes.length === viewNodes.length && nodes.length > 0) {
        let action = new AddItemsAction(
          self.nodeScene,
          self.designer,
          [],
          [],
          [],
          [],
          viewNodes,
          nodes
        );
        UndoStack.current.push(action);
      } else {
        console.log(
          "something is dragged into editor, but it's not handled properly"
        );
      }
    };

    this.nodeScene.onnodeselected = function(node: NodeGraphicsItem) {
      if (node != null) {
        self.selectedNodeId = node.id;

        let dnode = self.designer.getNodeById(node.id);
        if (dnode) dnode.onItemSelected();
        else console.error(`No corresponding designer item for ${node.id}`);

        if (self.preview2DCtx) {
          self.preview2DCtx.drawImage(
            node.imageCanvas.canvas,
            0,
            0,
            self.preview2D.width,
            self.preview2D.height
          );
        }

        if (self.onnodeselected) self.onnodeselected(dnode);
      }
    };

    this.nodeScene.oncommentselected = function(item: CommentGraphicsItem) {
      if (self.oncommentselected) self.oncommentselected(item);
    };

    this.nodeScene.onframeselected = function(item: FrameGraphicsItem) {
      if (self.onframeselected) self.onframeselected(item);
    };

    this.nodeScene.onwidgetselected = function(item: iWidget) {
      if (self.onwidgetselected) self.onwidgetselected(item);
    };

    this.nodeScene.onnavigationselected = function(
      item: NavigationGraphicsItem
    ) {
      if (self.onnavigationselected) self.onnavigationselected(item);
    };

    this.nodeScene.onnodedeleted = function(node: NodeGraphicsItem) {
      self.designer.removeNode(node.id);
    };

    this.nodeScene.oninputnodecreationattempt = function() {
      self.nodeScene.selectedItems = [self.nodeScene.inputNode];
      self.nodeScene.zoomSelected(self.nodeScene.selectedItems);
    };

    this.nodeScene.onoutputnodecreationattempt = function() {
      self.nodeScene.selectedItems = [self.nodeScene.outputNode];
      self.nodeScene.zoomSelected(self.nodeScene.selectedItems);
    };

    this.nodeScene.onitemsdeleting = function(
      frames: FrameGraphicsItem[],
      comments: CommentGraphicsItem[],
      navs: NavigationGraphicsItem[],
      cons: ConnectionGraphicsItem[],
      nodes: NodeGraphicsItem[]
    ) {
      let dnodes: DesignerNode[] = [];
      for (let node of nodes) {
        let dnode = self.designer.getNodeById(node.id);

        // should never happen!
        if (dnode == null) throw "Node with id " + dnode.id + " doesnt exist!!";

        dnodes.push(dnode);
      }

      let action = new RemoveItemsAction(
        self,
        self.nodeScene,
        self.designer,
        frames,
        comments,
        navs,
        cons,
        nodes,
        dnodes
      );
      UndoStack.current.push(action);
    };

    this.nodeScene.onitemsdeleted = function(
      frames: FrameGraphicsItem[],
      comments: CommentGraphicsItem[],
      navs: NavigationGraphicsItem[],
      cons: ConnectionGraphicsItem[],
      nodes: NodeGraphicsItem[]
    ) {
      for (let node of nodes) {
        let idx = self.nodeScene.selectedItems.indexOf(node);
        if (idx != -1) {
          self.nodeScene.selectedItems.splice(idx, 1);
        }
      }
    };

    this.nodeScene.oncopy = function(evt: ClipboardEvent) {
      self.executeCopy(evt);
    };

    this.nodeScene.oncut = function(evt: ClipboardEvent) {
      self.executeCut(evt);
    };

    this.nodeScene.onpaste = function(evt: ClipboardEvent) {
      self.executePaste(evt);
    };

    this.nodeScene.onlibrarymenu = function() {
      console.log(self.onlibrarymenu);
      if (self.onlibrarymenu != null) {
        self.onlibrarymenu();
      }
    };
  }

  executeCopy(evt: ClipboardEvent) {
    ItemClipboard.copyItems(
      this.designer,
      this.library,
      this.nodeScene,
      evt.clipboardData
    );
  }

  executeCut(evt: ClipboardEvent) {
    ItemClipboard.copyItems(
      this.designer,
      this.library,
      this.nodeScene,
      evt.clipboardData
    );
  }

  async executePaste(evt: ClipboardEvent) {
    let self = this;
    const html = evt.clipboardData.getData("text/html");
    if (html) {
      let dataUrl = await self.getImageUrl(html);
      if (dataUrl) {
        ItemClipboard.pasteImages(
          this.designer,
          this.library,
          this.nodeScene,
          dataUrl
        );
      }
    } else {
      ItemClipboard.pasteItems(
        this.designer,
        this.library,
        this.nodeScene,
        evt.clipboardData
      );
    }
  }

  // adds node
  // x and y are screen space
  addNode(
    dNode: DesignerNode,
    screenX: number = 0,
    screenY: number = 0
  ): NodeGraphicsItem {
    // must add to designer first
    this.designer.addNode(dNode);

    // create node from designer
    let node = new NodeGraphicsItem(dNode);
    this.nodeScene.addNode(node);

    let pos = this.nodeScene.view.canvasToSceneXY(screenX, screenY);
    node.setCenter(pos.x, pos.y);

    return node;
  }

  async getImageUrl(html: string): Promise<any> {
    let dropContext = $("<div>").append(html);
    let imgUrl = $(dropContext)
      .find("img")
      .attr("src");

    if (isDataUri(imgUrl)) {
      return imgUrl;
    } else {
      let blob = await fetch(imgUrl).then((r) => r.blob());
      let dataUrl = await new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => {
          let dataUrl = reader.result.toString();
          if (isDataUri(dataUrl)) {
            resolve(dataUrl);
          }
        };
        reader.readAsDataURL(blob);
      });
      return dataUrl;
    }
  }

  createFromUrl(dataUrl: string, x: number, y: number) {
    const type = dataUrl.substring(
      dataUrl.indexOf(":") + 1,
      dataUrl.indexOf(";")
    );
    // TODO: need to handle tihs if animated 'image/webp'
    if (type == "image/gif") {
      return this.createAnimationNodeFromUrl(dataUrl, x, y);
    } else {
      return this.createTextureNodeFromUrl(dataUrl, x, y);
    }
  }

  createAnimationNodeFromUrl(dataUrl: string, x: number, y: number) {
    let node;
    node = this.library.create("animation", dataUrl, true);

    let nodeView = this.addNode(node, 0, 0);
    nodeView.setCenter(x, y);
    return [node, nodeView];
  }

  createTextureNodeFromUrl(dataUrl: string, x: number, y: number) {
    let node;
    node = this.library.create("texture", dataUrl, true);

    let nodeView = this.addNode(node, 0, 0);
    nodeView.setCenter(x, y);
    return [node, nodeView];
  }

  createComment(): CommentGraphicsItem {
    let comment = new CommentGraphicsItem(this.nodeScene.view);
    let pos = this.nodeScene.view.sceneCenter;
    comment.setCenter(pos.x, pos.y);

    this.nodeScene.addComment(comment);

    return comment;
  }

  createFrame(): FrameGraphicsItem {
    let frame = new FrameGraphicsItem(this.nodeScene.view);
    let pos = this.nodeScene.view.sceneCenter;
    frame.setCenter(pos.x, pos.y);

    this.nodeScene.addFrame(frame);

    return frame;
  }

  createNavigation(): NavigationGraphicsItem {
    let nav = new NavigationGraphicsItem();
    let pos = this.nodeScene.view.sceneCenter;
    nav.setCenter(pos.x, pos.y);

    this.nodeScene.addNavigation(nav);

    return nav;
  }

  exposeVariable(node: DesignerNode, prop: Property, varDisplayName: string) {
    // create new variable
    let varName = Guid.newGuid();
    let dvar = this.designer.addVariable(
      varName,
      varDisplayName,
      this.evalDesignerVariableType(prop)
    );
    // copy over important props
    // todo:make more elegant
    dvar.property = prop.clone();
    dvar.property.name = varName;
    dvar.property.displayName = varDisplayName;

    // add it to scene and bind prop
    this.designer.mapNodePropertyToVariable(varName, node, prop.name);
  }

  evalDesignerVariableType(prop: Property): DesignerVariableType {
    if (prop.type == PropertyType.Float) {
      return DesignerVariableType.Float;
    } else if (prop.type == PropertyType.Int) {
      return DesignerVariableType.Int;
    } else if (prop.type == PropertyType.Bool) {
      return DesignerVariableType.Bool;
    } else if (prop.type == PropertyType.Enum) {
      return DesignerVariableType.Enum;
    } else if (prop.type == PropertyType.Color) {
      return DesignerVariableType.Color;
    } else if (prop.type == PropertyType.Asset) {
      return DesignerVariableType.Asset;
    } else {
      console.log("error: invalid property type for variable", prop);
    }

    return null;
  }

  update() {
    if (this.designer) this.designer.update();
  }

  draw() {
    if (this.nodeScene) this.nodeScene.draw();
  }

  load(data: any) {
    // clear texture channels
    let library;
    if (!data["libraryVersion"]) {
      library = createLibrary();
    } else {
      // library = this.createLibrary(data["libraryVersion"]);
      library = createLibrary();
    }
    // load scene
    let d = Designer.load(data, library);

    // load graph
    let g = NodeScene.load(d, data["scene"], this.canvas);

    // load metadata
    let md = ProjectItemData.fromNothing();

    if (data["item"]) {
      const item = data["item"];
      if (item["localItem"]) {
        md.localItem = plainToClass(LocalItemData, data["item"]["localItem"]);
      }
      if (item["workshopItem"]) {
        md.workshopItem = plainToClass(
          WorkshopItemData,
          data["item"]["workshopItem"]
        );
      }
    }

    this.setMetadata(md);
    this.setDesigner(d);
    this.setScene(g);

    // TODO: better way to handle this
    // scene.onconnectioncreated callback is established from now on, so we need to refresh it
    g.refresh();

    // assign each node to it's texture channel
    // it's expected at this point that the 3d preview should already
    // have the texturechannel callbacks assigned

    // load editor data
    if (data["editor"] != null) {
      let e = data["editor"];
      // console.log("loading editor data");

      for (let channelName in e.textureChannels) {
        if (!e.textureChannels.hasOwnProperty(channelName)) continue;
        console.log(e);
        let node = this.nodeScene.getNodeById(e.textureChannels[channelName]);
      }
    }

    this.nodeScene.view.reset();

    // todo: move to double click
    if (this.onpreviewnode) {
      const item = this.nodeScene.outputNode;
      const node = this.nodeScene.outputNode.dNode;
      this.onpreviewnode(node, item.imageCanvas.canvas);
    }

    this.refreshWidget();

    // zoom all nodes
    this.nodeScene.zoomSelected([...this.nodeScene.nodes]);

    // select outputNode
    this.nodeScene.setSelectedItems([this.nodeScene.outputNode]);
  }

  save(): any {
    let data = this.designer.save();
    data["scene"] = this.nodeScene.save();
    data["libraryVersion"] = getCurrentLibraryVersion();
    data["item"] = store.state.metadata.save();

    return data;
  }
}
