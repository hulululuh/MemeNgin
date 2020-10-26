import fs from "fs";
import path from "path";

//import * as scene from "./scene";
import { Designer } from "./designer";
import { DesignerNode } from "./designer/designernode";
import { Property, PropertyType } from "./designer/properties";
import { Guid } from "./utils";
import { DesignerVariableType } from "./designer/designervariable";
import { DesignerLibrary } from "./designer/library";
import { NodeScene } from "./scene";
import { ConnectionGraphicsItem } from "./scene/connectiongraphicsitem";
import { NodeGraphicsItem } from "./scene/nodegraphicsitem";
import { SocketType } from "./scene/socketgraphicsitem";
import { ImageCanvas } from "./designer/imagecanvas";

import { createLibrary as createV1Library } from "@/lib/library/libraryv1";
import { createLibrary as createV2Library } from "@/lib/library/libraryv2";
import { Color } from "./designer/color";
import { CommentGraphicsItem } from "./scene/commentgraphicsitem";
import { FrameGraphicsItem } from "./scene/framegraphicsitem";
import { Transform2dWidget } from "./scene/Transform2dWidget";
import { NavigationGraphicsItem } from "./scene/navigationgraphicsitem";
import { ItemClipboard } from "./clipboard";
import { UndoStack } from "./undostack";
import { AddItemsAction } from "./actions/additemsaction";
import { RemoveItemsAction } from "./actions/removeitemsaction";

import { MLModel } from "./mlmodel";

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

// stores the IDs for the display nodes
export class DisplayNodes {
  albedoNode: string;
  normalNode: string;
  roughnessNode: string;
  heightNode: string;
  metallicNode: string;
  /*
    albedoCanvas : ImageCanvas = new ImageCanvas();
    normalCanvas : ImageCanvas = new ImageCanvas();
    roughnessCanvas : ImageCanvas = new ImageCanvas();
    heightCanvas : ImageCanvas = new ImageCanvas();
    metallicCanvas : ImageCanvas = new ImageCanvas();

    resize(width:number, height:number)
    {
        this.albedoCanvas.resize(width, height);
        this.normalCanvas.resize(width, height);
        this.roughnessCanvas.resize(width, height);
        this.heightCanvas.resize(width, height);
        this.metallicCanvas.resize(width, height);
    }
    */
}

export enum DisplayChannel {
  Albedo,
  Metallic,
  Roughness,
  Normal,
  Height,
}

export enum FileType {
  Texture,
  LUT,
}

export class Editor {
  private static instance: Editor;

  canvas: HTMLCanvasElement;

  library: DesignerLibrary;
  nodeScene: NodeScene;
  designer: Designer;
  selectedDesignerNode: DesignerNode;

  undoStack: UndoStack;

  preview2D: HTMLCanvasElement;
  preview2DCtx: CanvasRenderingContext2D;

  //scene3D: any; // todo: set a type

  mlModel: MLModel;

  //   propGen: PropertyGenerator;
  //   varGen: VariableGenerator;
  displayNodes: DisplayNodes;

  onnodeselected?: (item: DesignerNode) => void;
  oncommentselected?: (item: CommentGraphicsItem) => void;
  onframeselected?: (item: FrameGraphicsItem) => void;
  onwidget2dselected?: (item: Transform2dWidget) => void;
  onnavigationselected?: (item: NavigationGraphicsItem) => void;
  onpreviewnode?: (item: DesignerNode, image: HTMLCanvasElement) => void;
  onlibrarymenu?: () => void;

  textureChannels = {};
  ontexturechannelcleared?: (
    imageCanvas: ImageCanvas,
    channelName: string
  ) => void;
  ontexturechannelassigned?: (
    imageCanvas: ImageCanvas,
    channelName: string
  ) => void;
  ontexturechannelupdated?: (
    imageCanvas: ImageCanvas,
    channelName: string
  ) => void;

  constructor() {
    Editor.instance = this;
    this.displayNodes = new DisplayNodes();
    this.selectedDesignerNode = null;
    this.undoStack = new UndoStack();
    this.mlModel = new MLModel();
  }

  static getInstance() {
    if (!Editor.instance) {
      Editor.instance = new Editor();
    }
    return Editor.instance;
  }

  static getDesigner() {
    const editor = this.getInstance();
    return editor.designer;
  }

  getMLModel() {
    return this.mlModel;
  }

  getImageWidth() {
    return this.designer.width;
  }

  getImageHeight() {
    return this.designer.height;
  }

  assignNodeToTextureChannel(nodeId: string, channelName: string) {
    // only one node can be assigned to a channel
    if (
      this.textureChannels.hasOwnProperty(channelName) &&
      this.textureChannels[channelName]
    ) {
      // remove label from node view
      let oldNode = this.textureChannels[channelName] as DesignerNode;
      let nodeView = this.nodeScene.getNodeById(oldNode.id);
      nodeView.clearTextureChannel();
      //this.textureChannels[channelName] = null;
      delete this.textureChannels[channelName];

      if (this.ontexturechannelcleared) {
        this.ontexturechannelcleared(null, channelName);
      }
    }

    let nodeView = this.nodeScene.getNodeById(nodeId);
    nodeView.setTextureChannel(channelName);

    let newNode = this.designer.getNodeById(nodeId);
    this.textureChannels[channelName] = newNode;

    // // notify 3d view
    // if (this.ontexturechannelcleared) {
    //   this.ontexturechannelassigned(nodeView.imageCanvas, channelName);
    // }
  }

  clearTextureChannel(nodeId: string) {
    // eval which channel has this node assigned
    for (let channelName in this.textureChannels) {
      let node = this.textureChannels[channelName];

      if (node.id == nodeId) {
        let oldNode = this.textureChannels[channelName] as DesignerNode;
        let nodeView = this.nodeScene.getNodeById(oldNode.id);

        // if this function is called when a node is deleted
        // nodeView will be null
        if (nodeView) nodeView.clearTextureChannel();

        delete this.textureChannels[channelName];

        if (this.ontexturechannelcleared) {
          this.ontexturechannelcleared(null, channelName);
        }
      }
    }

    // only one node can be assigned to a channel
    // if (this.textureChannels.hasOwnProperty(channelName)) {
    //   // remove label from node view
    //   let oldNode = this.textureChannels[channelName] as DesignerNode;
    //   let nodeView = this.graph.getNodeById(oldNode.id);
    //   nodeView.clearTextureChannel();
    //   this.textureChannels[channelName] = null;

    //   if (this.ontexturechannelcleared) {
    //     this.ontexturechannelcleared(oldNode, channelName);
    //   }
    // }
  }

  hasTextureChannel(channelName: string) {
    return this.textureChannels.hasOwnProperty(channelName);
  }

  clearTextureChannels() {
    for (let channelName in this.textureChannels) {
      let node = this.textureChannels[channelName];

      this.clearTextureChannel(node.id);
    }
  }

  getChannelCanvasImage(channelName: string) {
    if (this.hasTextureChannel(channelName)) {
      //console.log(this.textureChannels[channelName]);
      let dnodeId = this.textureChannels[channelName].id;
      let nodeView = this.nodeScene.getNodeById(dnodeId);
      //console.log(nodeView)
      //console.log(this.graph)
      return nodeView.imageCanvas;
    }

    return null;
  }

  /*
    constructor(canvas:HTMLCanvasElement, preview2D:HTMLCanvasElement, propHolder : HTMLElement, varHolder : HTMLElement, scene3D:any)
    {
        this.canvas = canvas;

        this.displayNodes = new DisplayNodes();

        this.preview2D = preview2D;
        this.preview2DCtx = preview2D.getContext("2d");

        this.scene3D = scene3D;
        this.selectedDesignerNode = null;

        this.propGen = new PropertyGenerator(this, propHolder);
        this.varGen = new VariableGenerator(this, varHolder);
        

        //this.setDesigner(new Designer());
        //this.setScene(new NodeScene(canvas));
    }
    */

  undo() {
    this.undoStack.undo();
  }

  redo() {
    this.undoStack.redo();
  }

  // create empty scene
  createEmptyScene() {
    this.clearTextureChannels();

    this.library = createV2Library();
    this.setDesigner(new Designer());
    this.setScene(new NodeScene(this.canvas));

    // refresh everything
    this.designer.invalidateAllNodes();

    const centerX = 0;
    const centerY = 0;

    // input
    let inputNode = this.library.create("texture");
    inputNode.setAsInput();
    let inputNodeView = this.addNode(inputNode, 0, 0);
    inputNodeView.setCenter(centerX, centerY);

    // output
    let node = this.library.create("output");
    node.setAsResult();
    let nodeView = this.addNode(node, 0, 0);
    // figure out why this doesnt work before adding addNode:
    node.setProperty("color", new Color(1, 1, 1, 1));
    nodeView.setCenter(centerX + 150, centerY);
    console.log(nodeView);
    this.assignNodeToTextureChannel(nodeView.id, "albedo");
    this.nodeScene.view.reset();

    // connection
    this.nodeScene.createConnection(inputNode.id, node.id, 0);

    const dnode = this.designer.getNodeById(node.id);
    const graphNode = this.nodeScene.getNodeById(dnode.id);
    // todo: move to double click
    if (this.onpreviewnode) {
      this.onpreviewnode(dnode, graphNode.imageCanvas.canvas);
    }
  }

  // creates new texture
  // requires canvas to be already set
  createNewTexture() {
    this.clearTextureChannels();

    this.library = createV2Library();
    this.setDesigner(new Designer());
    this.setScene(new NodeScene(this.canvas));

    this.createEmptyScene();
  }

  set2DPreview(preview2D: HTMLCanvasElement) {
    this.preview2D = preview2D;
    this.preview2DCtx = preview2D.getContext("2d");
  }

  setSceneCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setScene(new NodeScene(canvas));
  }

  resizeScene(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  // set3DScene(scene3D: any) {
  //   this.scene3D = scene3D;
  // }

  setDesigner(designer: Designer) {
    this.designer = designer;
    let self = this;

    designer.onnodetextureupdated = function(dnode) {
      let graphNode = self.nodeScene.getNodeById(dnode.id);
      if (!graphNode) return; // node could have been deleted

      // something worng with fbo setup around here.
      self.designer.copyNodeTextureToImageCanvas(dnode, graphNode.imageCanvas);

      // if (self.onpreviewnode) {
      //   if (dnode == self.selectedDesignerNode)
      //     self.onpreviewnode(dnode, graphNode.imageCanvas.canvas);
      // }

      if (self.ontexturechannelupdated && graphNode.textureChannel) {
        self.ontexturechannelupdated(
          graphNode.imageCanvas,
          graphNode.textureChannel
        );
      }
      // if(node == self.selectedDesignerNode) {
      //     requestAnimationFrame(function(){
      //         self.preview2DCtx.clearRect(0,0,self.preview2D.width, self.preview2D.height);
      //         self.preview2DCtx.drawImage(graphNode.imageCanvas.canvas,
      //             0,0,
      //         self.preview2D.width, self.preview2D.height);
      //     });
      // }

      //self.updateDisplayNode(graphNode);
    };

    /*
        designer.onthumbnailgenerated = function(node, thumb) {
            console.log(self.selectedDesignerNode);
            console.log("onthumbnailgenerated generated for: "+node.title);
            // refresh right node image
            let graphNode = self.graph.getNodeById(node.id);
            graphNode.setThumbnail(thumb);
            self.updateDisplayNode(graphNode);

            if(node == self.selectedDesignerNode) {
                requestAnimationFrame(function(){
                    self.preview2DCtx.clearRect(0,0,self.preview2D.width, self.preview2D.height);
                    self.preview2DCtx.drawImage(thumb,
                        0,0,
                    self.preview2D.width, self.preview2D.height);
                });

                
            }
        }
        */

    //if (this.varGen) this.varGen.setDesigner(designer);
    //this.propGen.setDesigner(designer);
  }

  setScene(scene: NodeScene) {
    // cleanup previous graph
    if (this.nodeScene) this.nodeScene.dispose();

    this.undoStack = new UndoStack();
    UndoStack.current = this.undoStack;

    this.nodeScene = scene;

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

      // refresh right node image
      //let thumb = self.designer.generateImageFromNode(rightDNode);
      //rightNode.setThumbnail(thumb);
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

    this.canvas.ondrop = function(ev: DragEvent) {
      const zoomFactor = self.nodeScene.view.zoomFactor;
      const x = (ev.offsetX - self.nodeScene.view.offset[0]) / zoomFactor;
      const y = (ev.offsetY - self.nodeScene.view.offset[1]) / zoomFactor;

      let isValidImagePath = (filePath: string) => {
        let isValid = filePath.length > 0;
        if (isValid) {
          // TODO: check the path indicates proper image path
          let stats = fs.statSync(filePath);
          isValid = stats.isFile();
        }
        return isValid;
      };

      let getFileType = (filePath: string) => {
        const ext = path.extname(filePath).toLowerCase();

        if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
          return FileType.Texture;
        } else if (ext === ".cube") {
          return FileType.LUT;
        } else {
          return undefined;
        }
      };

      let viewNodes = [];
      let nodes = [];

      let offset = [0, 0];
      // for (let idx = 0; idx < ev.dataTransfer.files.length; idx++) {
      for (let file of ev.dataTransfer.files) {
        if (isValidImagePath(file.path)) {
          const fileType = getFileType(file.path);
          let node;
          if (fileType === FileType.Texture) {
            node = self.library.create("texture", file.path);
          } else if (fileType === FileType.LUT) {
            node = self.library.create("colorgrade", file.path);
          }
          let nodeView = self.addNode(node, 0, 0);
          nodeView.setCenter(x + offset[0], y + offset[1]);

          nodes.push(node);
          viewNodes.push(nodeView);

          offset = [offset[0] + 15, offset[1] + 15];
        }

        // import texture then make a node
        //self.assignNodeToTextureChannel(nodeView.id, "albedo");
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
        let dnode = self.designer.getNodeById(node.id);
        self.selectedDesignerNode = dnode;
        //console.log(dnode);

        if (self.preview2DCtx) {
          self.preview2DCtx.drawImage(
            node.imageCanvas.canvas,
            0,
            0,
            self.preview2D.width,
            self.preview2D.height
          );
        }

        // // todo: move to double click
        // if (self.onpreviewnode) {
        //   self.onpreviewnode(dnode, node.imageCanvas.canvas);
        // }

        // //console.log(this.scene3D);
        // if (self.scene3D) {
        //   //console.log("setting height texture");
        //   //self.scene3D.setHeightTexture(node.thumbnail);
        //   self.updateDisplayNode(node);
        // }
        if (self.onnodeselected) self.onnodeselected(dnode);
      }
    };

    this.nodeScene.oncommentselected = function(item: CommentGraphicsItem) {
      if (self.oncommentselected) self.oncommentselected(item);
    };

    this.nodeScene.onframeselected = function(item: FrameGraphicsItem) {
      if (self.onframeselected) self.onframeselected(item);
    };

    this.nodeScene.onwidget2dselected = function(item: Transform2dWidget) {
      if (self.onwidget2dselected) self.onwidget2dselected(item);
    };

    this.nodeScene.onnavigationselected = function(
      item: NavigationGraphicsItem
    ) {
      if (self.onnavigationselected) self.onnavigationselected(item);
    };

    this.nodeScene.onnodedeleted = function(node: NodeGraphicsItem) {
      // remove node from channels
      //console.log(self);
      self.clearTextureChannel(node.id);

      self.designer.removeNode(node.id);

      // if (self.onpreviewnode) {
      //   self.onpreviewnode(null, null);
      // }
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
      // if (self.onpreviewnode) {
      //   self.onpreviewnode(null, null);
      // }
      // clear selected items
      self.nodeScene.selectedItems.splice(
        0,
        self.nodeScene.selectedItems.length
      );
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

    // property changes
    /*
        this.propGen.onnodepropertychanged = function(dnode:DesignerNode, prop:Property) {
            //let node = self.graph.getNodeById(node.id);
            //self.graph.refreshNode()
            
            // todo: do this properly
            let thumb = self.designer.generateImageFromNode(dnode);
            let node = self.graph.getNodeById(dnode.id);
            node.thumbnail = thumb;

            //console.log(node.thumbnail);
            requestAnimationFrame(function(){
                self.preview2DCtx.clearRect(0,0,self.preview2D.width, self.preview2D.height);
                self.preview2DCtx.drawImage(thumb,
                    0,0,
                self.preview2D.width, self.preview2D.height);
            });
            
            // just a stest
            //self.scene3D.setHeightTexture(node.thumbnail);
            self.updateDisplayNode(node);
        }
        */
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

  executePaste(evt: ClipboardEvent) {
    ItemClipboard.pasteItems(
      this.designer,
      this.library,
      this.nodeScene,
      evt.clipboardData
    );
  }

  createThumnail(dNode: DesignerNode, node: NodeGraphicsItem) {
    if (!dNode.readyToUpdate()) return;
    let thumb = this.designer.generateImageFromNode(dNode);
    node.setThumbnail(thumb);
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
    let node = new NodeGraphicsItem(dNode.title);
    node.setVirtualSize(dNode.getWidth(), dNode.getHeight());

    for (let input of dNode.getInputs()) {
      node.addSocket(input, input, SocketType.In);
    }
    node.addSocket("output", "output", SocketType.Out);
    this.nodeScene.addNode(node);
    node.id = dNode.id;

    let pos = this.nodeScene.view.canvasToSceneXY(screenX, screenY);
    node.setCenter(pos.x, pos.y);

    // if (dNode.readyToUpdate()) {
    //   this.createThumnail(dNode, node);
    // }

    return node;
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

  // DISPLAY NODE FUNCTIONS

  // // updates appropriate image if set
  // updateDisplayNode(node: NodeGraphicsItem) {
  //   if (!this.scene3D) return;

  //   //console.log(node.id);
  //   //console.log(this.displayNodes.normalNode);

  //   // TODO: create custom CanvasImage that resizes with
  //   // the texture size. NodeGraphicsItem's CanvasImage is fixed
  //   // to 1024x1024. Another option is to give each DesignerNode a
  //   // CanvasImage that updates when its texture updates then pass
  //   // it to NodeGraphicsitem. That way it gets used one place and
  //   // gets updated everywhere else all at once.
  //   if (node.id == this.displayNodes.albedoNode) {
  //     //this.scene3D.setAlbedoTexture(node.thumbnail);
  //     this.scene3D.setAlbedoCanvasTexture(node.imageCanvas.canvas);
  //   }

  //   if (node.id == this.displayNodes.metallicNode) {
  //     //this.scene3D.setMetallicTexture(node.thumbnail);
  //     this.scene3D.setMetallicCanvasTexture(node.imageCanvas.canvas);
  //   }

  //   if (node.id == this.displayNodes.normalNode) {
  //     //this.scene3D.setNormalTexture(node.thumbnail);
  //     this.scene3D.setNormalCanvasTexture(node.imageCanvas.canvas);
  //   }

  //   if (node.id == this.displayNodes.roughnessNode) {
  //     //this.scene3D.setRoughnessTexture(node.thumbnail);
  //     this.scene3D.setRoughnessCanvasTexture(node.imageCanvas.canvas);
  //   }

  //   if (node.id == this.displayNodes.heightNode) {
  //     //this.scene3D.setHeightTexture(node.thumbnail);
  //     this.scene3D.setHeightCanvasTexture(node.imageCanvas.canvas);
  //   }
  // }

  setDisplayChannelNode(channel: DisplayChannel, nodeId: string) {
    let node = this.nodeScene.getNodeById(nodeId);
    if (channel == DisplayChannel.Albedo) {
      this.displayNodes.albedoNode = nodeId;
    }
    if (channel == DisplayChannel.Metallic) {
      this.displayNodes.metallicNode = nodeId;
    }
    if (channel == DisplayChannel.Normal) {
      this.displayNodes.normalNode = nodeId;
    }
    if (channel == DisplayChannel.Roughness) {
      this.displayNodes.roughnessNode = nodeId;
    }
    if (channel == DisplayChannel.Height) {
      this.displayNodes.heightNode = nodeId;
    }

    //this.updateDisplayNode(node);
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

    // copy property props

    // refresh let ui
    // this.varGen.refreshUi();
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
    this.clearTextureChannels();

    let library;
    if (!data["libraryVersion"]) {
      library = createV2Library();
    } else {
      // library = this.createLibrary(data["libraryVersion"]);
      library = createV2Library();
    }
    // load scene
    let d = Designer.load(data, library);

    // load graph
    let g = NodeScene.load(d, data["scene"], this.canvas);

    //todo: properly destroy existing graph

    //this.designer = d;
    //this.graph = g;
    this.setDesigner(d);
    this.setScene(g);

    // assign each node to it's texture channel
    // it's expected at this point that the 3d preview should already
    // have the texturechannel callbacks assigned

    // load editor data
    if (data["editor"] != null) {
      let e = data["editor"];
      // console.log("loading editor data");
      // console.log(e.displayNodes);

      // this.displayNodes.albedoNode = e.displayNodes.albedoNode;
      // this.displayNodes.metallicNode = e.displayNodes.metallicNode;
      // this.displayNodes.normalNode = e.displayNodes.normalNode;
      // this.displayNodes.roughnessNode = e.displayNodes.roughnessNode;
      // this.displayNodes.heightNode = e.displayNodes.heightNode;

      for (let channelName in e.textureChannels) {
        if (!e.textureChannels.hasOwnProperty(channelName)) continue;
        console.log(e);
        let node = this.nodeScene.getNodeById(e.textureChannels[channelName]);
        if (node) this.assignNodeToTextureChannel(node.id, channelName);
      }

      //this.textureChannels = e.textureChannels || {};
      //console.log(this.textureChannels)
    }
  }

  save(): any {
    let data = this.designer.save();
    data["scene"] = this.nodeScene.save();

    let textureChannels = {};
    for (let channelName in this.textureChannels) {
      textureChannels[channelName] = this.textureChannels[channelName].id;
    }

    data["editor"] = {
      //displayNodes: this.displayNodes,
      textureChannels: textureChannels,
    };

    //data["libraryVersion"] = this.library.getVersionName();
    data["libraryVersion"] = "v1";

    return data;
  }
}
