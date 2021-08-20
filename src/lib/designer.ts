// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { Color } from "./designer/color";
import { DesignerNodeConn } from "./designer/designerconnection";
import { DesignerNode, NodeInput, NodeType } from "./designer/designernode";
import {
  DesignerNodePropertyMap,
  DesignerVariable,
  DesignerVariableType,
} from "./designer/designervariable";
import { buildShaderProgram } from "./designer/gl";
import { ImageCanvas } from "./designer/imagecanvas";
import { ImageDesignerNode } from "./designer/imagedesignernode";
import { DesignerLibrary } from "./designer/library";
import { LogicDesignerNode } from "./designer/logicdesignernode";
import {
  AssetProperty,
  BoolProperty,
  ColorProperty,
  EnumProperty,
  FloatProperty,
  IntProperty,
} from "./designer/properties";
import { Editor } from "./editor";
import { FloatPropertyNode } from "./library/nodes/floatpropertynode";
import { StringPropertyNode } from "./library/nodes/stringpropertynode";
import { TextNode } from "./library/nodes/textnode";
import { Guid } from "./utils";
import { AssetType } from "@/assets/assetmanager";
import { TextManager } from "@/assets/textmanager";
import { TextureNode } from "@/lib/library/nodes/texturenode";
import { OutputNode } from "./library/nodes/outputnode";
import { MapFloatNode } from "./library/nodes/mapfloatnode";

const HALF = 0.5;

export function canvasToURL(img: HTMLCanvasElement) {
  let canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  let ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const url = canvas.toDataURL("image/webp", 1.0);
  return url;
}

enum FitMode {
  Width,
  Height,
  Long,
}
const fitMode: FitMode = FitMode.Height;

export function canvasToThumbnailURL(img: HTMLCanvasElement) {
  let canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  let ctx = canvas.getContext("2d");
  let scale = 1;

  switch (fitMode) {
    case FitMode.Height:
      scale = canvas.height / img.height;
      break;
    case FitMode.Width:
      scale = canvas.width / img.width;
      break;
    case FitMode.Long:
      scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      break;
  }

  let x = canvas.width / 2 - (img.width / 2) * scale;
  let y = canvas.height / 2 - (img.height / 2) * scale;
  ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

  const url = canvas.toDataURL("image/webp", 1.0);
  return url;
}

export class Designer {
  dummyTex: WebGLTexture;

  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;

  texCoordBuffer: WebGLBuffer;
  posBuffer: WebGLBuffer;
  vertexShaderSource: string;
  fbo: WebGLFramebuffer;
  thumbnailProgram: WebGLProgram;

  randomSeed: number;
  width: number;
  height: number;

  nodes: DesignerNode[];
  conns: DesignerNodeConn[];

  // list of nodes yet to be designed
  updateList: DesignerNode[];

  library: DesignerLibrary;

  //variables
  variables: DesignerVariable[];

  // callbacks
  onthumbnailgenerated: (DesignerNode, HTMLImageElement) => void;

  // called everytime a node's texture gets updated
  // listeners can use this update their CanvasTextures
  // by rendering the node's texture with renderNodeTextureToCanvas(node, imageCanvas)
  onnodetextureupdated: (DesignerNode) => void;

  constructor() {
    this.width = 1024;
    this.height = 1024;
    this.randomSeed = 32;

    this.canvas = <HTMLCanvasElement>document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.gl = this.canvas.getContext("webgl2", {
      premultipliedAlpha: false,
    });

    const gl = this.gl;
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    this.nodes = new Array();
    this.conns = new Array();

    this.updateList = new Array();
    this.variables = new Array();
    this.init();
  }

  setTextureSize(width: number, height: number) {
    //todo: is resizing the canvas even necessary?
    this.width = width;
    this.height = height;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // for (let node of this.nodes) {
    //   node.createTexture();
    //   this.requestUpdate(node);
    // }
  }

  randomizeSeed() {
    this.setRandomSeed(Math.floor(Math.random() * 256));
  }

  setRandomSeed(newSeed: number) {
    this.randomSeed = newSeed;
    // invalidate all nodes
    this.invalidateAllNodes();
  }

  getRandomSeed(): number {
    return this.randomSeed;
  }

  init() {
    this.createVertexBuffers();
    this.createFBO();
    this.createThumbnailProgram();
    this.createDummyTexture();
  }

  update() {
    let updateQuota = 10000000000000;
    // fetch random node from update list (having all in sockets that have been updated) and update it
    // todo: do only on per update loop
    while (this.updateList.length != 0) {
      for (let node of this.updateList) {
        if (this.haveAllUpdatedLeftNodes(node)) {
          // if (node.hasBaseTexture() && !node.readyToUpdate()) {
          //   this.updateList.splice(this.updateList.indexOf(node), 1);
          //   node.needsUpdate = false;
          //   continue;
          // }

          // update this node's texture and thumbnail

          // a note about this:
          // technically all the child nodes should be updated here, so this.updateList
          // wont be touched in this function
          // so we avoid messing up our loop since the length of this.updateList wont change
          if (node instanceof ImageDesignerNode)
            this.generateImageFromNode(node);
          else if (node instanceof LogicDesignerNode)
            this.generateDataFromNode(node);

          // remove from list
          this.updateList.splice(this.updateList.indexOf(node), 1);
          node.needsUpdate = false;
          //break;// one per update loop

          updateQuota--;
          if (updateQuota < 0) break;
        }
      }
    }
  }

  // checks if all input nodes have needsUpdate set to false
  haveAllUpdatedLeftNodes(node: DesignerNode): boolean {
    for (let con of this.conns) {
      // get connections to this node
      if (con.rightNode == node) {
        if (con.leftNode.needsUpdate == true) {
          // found a node that needs update itself
          return false;
        }
      }
    }

    return true;
  }

  // adds node to update list
  // add subsequent (output) nodes in tree to update list a well, recursively
  requestUpdate(node: DesignerNode) {
    if (this.updateList.indexOf(node) == -1) {
      // not yet in the list, add to list and add dependent nodes
      node.needsUpdate = true; // just in case...
      this.updateList.push(node);
    }

    // add all right connections
    for (let con of this.conns) {
      if (con.leftNode == node) {
        this.requestUpdate(con.rightNode);
      }
    }
  }

  requestUpdateChilds(node: DesignerNode) {
    // add all right connections
    for (let con of this.conns) {
      if (con.leftNode == node) {
        if (this.updateList.indexOf(con.rightNode) == -1) {
          // not yet in the list, add to list and add dependent nodes
          con.rightNode.needsUpdate = true; // just in case...
          this.updateList.push(con.rightNode);
        }
      }
    }
  }

  invalidateAllNodes() {
    for (let node of this.nodes) {
      this.requestUpdate(node);
    }
  }

  setLibrary(lib: DesignerLibrary) {
    this.library = lib;
  }

  // creates node and adds it to scene
  createNode(name: string): DesignerNode {
    let node = this.library.create(name);

    this.addNode(node);
    return node;
  }

  createFBO() {
    let gl = this.gl;

    this.fbo = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);

    // gotta create at least a renderbuffer
  }

  createVertexBuffers() {
    let gl = this.gl;
    //let texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

    // provide texture coordinates for the rectangle.
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.0,
        0.0,
        1.0,
        0.0,
        0.0,
        1.0,
        0.0,
        1.0,
        1.0,
        0.0,
        1.0,
        1.0,
      ]),
      gl.STATIC_DRAW
    );
    //gl.enableVertexAttribArray(texCoordLocation);
    //gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    this.posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -HALF,
        -HALF,
        0.0,
        HALF,
        -HALF,
        0.0,
        -HALF,
        HALF,
        0.0,
        -HALF,
        HALF,
        0.0,
        HALF,
        -HALF,
        0.0,
        HALF,
        HALF,
        0.0,
      ]),
      gl.STATIC_DRAW
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  // adds node to scene
  // adds it to this.updateList
  // if `init` is set to false, node will not be initialized
  // useful for undo-redo where node is re-added
  addNode(node: DesignerNode, init: boolean = true) {
    this.nodes.push(node);
    if (init) {
      node.gl = this.gl;
      node.designer = this;
      node._init();
    }
    this.requestUpdate(node);
  }

  getNodeById(nodeId: string): DesignerNode {
    for (let node of this.nodes) {
      if (node.id == nodeId) return node;
    }
    return null;
  }

  addConnection(
    leftNode: DesignerNode,
    rightNode: DesignerNode,
    rightIndex: string
  ) {
    // make connection
    let con = new DesignerNodeConn();
    con.leftNode = leftNode;
    con.rightNode = rightNode;
    con.rightNodeInput = rightIndex;

    this.conns.push(con);

    rightNode.connected(leftNode, rightIndex);

    return con;
  }

  removeConnection(
    leftNode: DesignerNode,
    rightNode: DesignerNode,
    rightIndex: string
  ) {
    for (let con of this.conns) {
      if (
        con.leftNode == leftNode &&
        con.rightNode == rightNode &&
        con.rightNodeInput == rightIndex
      ) {
        // right node needs to be updated
        if (rightNode.ondisconnected) {
          rightNode.ondisconnected(leftNode, rightIndex);
        }

        this.requestUpdate(rightNode);

        // found our connection, remove
        this.conns.splice(this.conns.indexOf(con), 1);
        //console.log("removed connection in designer");
        //console.log(con);

        return con;
      }
    }

    return null;
  }

  // todo: double check connections just in case
  removeNode(nodeId: string): DesignerNode {
    let node = this.getNodeById(nodeId);
    if (!node) {
      return null;
    }

    this.nodes.splice(this.nodes.indexOf(node), 1);

    // it's safe here to pluck this node right out of the update queue
    // the connections would have been already removed, triggering
    // updates for the previously neighbor nodes already
    while (this.updateList.indexOf(node) !== -1)
      this.updateList.splice(this.updateList.indexOf(node), 1);
  }

  generateImage(name: string): Promise<HTMLImageElement> {
    let node: DesignerNode = this.getNodeByName(name);
    return this.generateImageFromNode(node);
  }

  generateDataFromNode(dNode: DesignerNode): any {
    if (!(dNode instanceof LogicDesignerNode)) {
      console.warn("Trying to generate data of Non-Logic node. aborting...");
      return;
    }

    let graphNode = Editor.getScene().getNodeById(dNode.id);
    if (!graphNode) return; // node could have been deleted

    let nodeValue;
    let node = dNode as LogicDesignerNode;

    node.properties.forEach((p, i) => {
      let inputNode = this.findLeftNode(node.id, p.name);

      // update parentNode if exists
      if (inputNode && inputNode.needsUpdate) {
        this.generateDataFromNode(inputNode);
        inputNode.needsUpdate = false;
        this.updateList.splice(this.updateList.indexOf(inputNode), 1);
      }

      let prop = node.properties[i];
      if (prop.exposed && inputNode instanceof LogicDesignerNode) {
        prop.parentValue = (inputNode as LogicDesignerNode).calculated();
      }
    });

    // for calculated logic nodes
    nodeValue = node.calculated();

    // format property value for display
    if (dNode instanceof FloatPropertyNode || dNode instanceof MapFloatNode) {
      if (typeof nodeValue === "string") {
        nodeValue = parseFloat(nodeValue);
      }
      nodeValue = nodeValue.toFixed(3);
    } else if (dNode instanceof StringPropertyNode) {
      nodeValue = TextManager.translate(nodeValue);
      // in case prop is empty string
      if (typeof nodeValue === "string" && nodeValue.length === 0) {
        nodeValue = "${string}";
      }

      const prevLength = 9;
      if (nodeValue.length > prevLength) {
        nodeValue = nodeValue.substring(0, prevLength - 1) + "...";
      }
    }

    graphNode.value = nodeValue;
  }

  // this function generates the image of the node given its input nodes
  // if the input nodes arent updated then it will update them
  // for every node updated in this function, it emits onthumbnailgenerated(node, thumbnail)
  // it returns a thumbnail (an html image)

  async generateImageFromNode(dnode: DesignerNode): Promise<HTMLImageElement> {
    // Procedural : Render >> Get fbo texture then use it as thumbnail
    // Text : bind text layout as baseTex >> Render >> Get fbo texture then use it as thumbnail
    // Texture : textures already loaded into node.tex (skip the rendering)
    let thumb;
    let node = dnode as ImageDesignerNode;

    if (
      node.nodeType === NodeType.Procedural ||
      node.nodeType === NodeType.Text ||
      node.nodeType === NodeType.Texture
    ) {
      console.log("generating node " + node.exportName);
      // process input nodes
      let inputs: NodeInput[] = this.getNodeInputs(node);
      for (let input of inputs) {
        if (input.node.needsUpdate) {
          // if (input.node.hasBaseTexture() && !input.node.readyToUpdate())
          //   continue;

          this.generateImageFromNode(input.node);

          // remove from update list since thumbnail has now been generated
          input.node.needsUpdate = false;
          this.updateList.splice(this.updateList.indexOf(input.node), 1);
        }
      }

      for (let prop of node.getExposedProperties()) {
        let propNode = this.findLeftNode(node.id, prop.name);
        if (propNode instanceof LogicDesignerNode) {
          let propValFromParent = (propNode as LogicDesignerNode).calculated();
          if (prop.getParentValue() != propValFromParent) {
            prop.parentValue = propValFromParent;

            if (node.onnodepropertychanged) {
              node.onnodepropertychanged(prop);
            }
          }
        }
      }

      if (inputs.length > 0) {
        let parent = node.getParentNode();
        if (parent && !node.customSize) {
          node.resize(parent.getWidth(), parent.getHeight());
        }

        // Async work required before render: detect, stylize
        if (node.createTextureAsync) {
          await node.createTextureAsync();
          Editor.getDesigner().requestUpdateChilds(node);
          thumb = this.prepareThumbnail(node);
        } else if (node instanceof TextNode) {
          // default
          thumb = this.prepareThumbnail(node);
        } else {
          // default
          node.createTexture();
          node.requestUpdate();
          thumb = this.prepareThumbnail(node);
        }
      } else {
        // no input: texture
        thumb = this.prepareThumbnail(node);
      }
    }

    return thumb;
  }

  prepareThumbnail(dnode: DesignerNode) {
    let node = dnode as ImageDesignerNode;
    let inputs: NodeInput[] = this.getNodeInputs(node);
    let gl = this.gl;

    // todo: move to node maybe
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.activeTexture(gl.TEXTURE0);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      node.getBaseTexture(),
      0
    );

    gl.viewport(0, 0, node.getWidth(), node.getHeight());
    node.render(inputs);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    if (this.onnodetextureupdated) {
      this.onnodetextureupdated(node);
    }

    let thumb = this.generateThumbnailFromNode(node);
    if (this.onthumbnailgenerated) {
      this.onthumbnailgenerated(node, thumb);
    }

    return thumb;
  }

  // renders node's texture to an image object
  // ensure the node is updated before calling this function
  // this function doesnt try to update child nodes
  generateThumbnailFromNode(dnode: DesignerNode) {
    let node = dnode as ImageDesignerNode;
    let gl = this.gl;

    //gl.clearColor(1, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // bind shader
    gl.useProgram(this.thumbnailProgram);

    // bind mesh
    let posLoc = gl.getAttribLocation(this.thumbnailProgram, "a_pos");
    //let texCoordLoc = gl.getAttribLocation(this.thumbnailProgram, "a_texCoord");

    // provide texture coordinates for the rectangle.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    // gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    // gl.enableVertexAttribArray(texCoordLoc);
    // gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    // send texture
    gl.uniform1i(gl.getUniformLocation(this.thumbnailProgram, "tex"), 0);
    gl.activeTexture(gl.TEXTURE0);

    // TODO: check from here
    gl.bindTexture(gl.TEXTURE_2D, node.getBaseTexture());

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindTexture(gl.TEXTURE_2D, null);

    // cleanup
    gl.disableVertexAttribArray(posLoc);
    //gl.disableVertexAttribArray(texCoordLoc);

    return null;

    //let img:HTMLImageElement = <HTMLImageElement>document.createElement("image");
    //let img:HTMLImageElement = new Image(this.width, this.height);
    //img.src = this.canvas.toDataURL("image/png");

    // note: this called right after clears the image for some reason
    //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //return img;
    //return null;
  }

  // render's node's texture then draws it on the given canvas
  // used as an alternative to move textures since toDataUrl is
  // so computationally expensive
  copyNodeTextureToImageCanvas(dnode: DesignerNode, canvas: ImageCanvas) {
    let node = dnode as ImageDesignerNode;
    let gl = this.gl;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // bind shader
    gl.useProgram(this.thumbnailProgram);

    // bind mesh
    let posLoc = gl.getAttribLocation(this.thumbnailProgram, "a_pos");
    //let texCoordLoc = gl.getAttribLocation(this.thumbnailProgram, "a_texCoord");

    // provide texture coordinates for the rectangle.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    // gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    // gl.enableVertexAttribArray(texCoordLoc);
    // gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    // send texture
    gl.uniform1i(gl.getUniformLocation(this.thumbnailProgram, "tex"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, node.getBaseTexture());

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindTexture(gl.TEXTURE_2D, null);
    // cleanup
    gl.disableVertexAttribArray(posLoc);
    //gl.disableVertexAttribArray(texCoordLoc);

    // force rendering to be complete
    //gl.flush();
    canvas.copyFromCanvas(this.canvas, true);
  }

  createThumbnailProgram() {
    let prog = buildShaderProgram(
      this.gl,
      `precision mediump float;

        attribute vec3 a_pos;
        //attribute vec2 a_texCoord;

        // the texCoords passed in from the vertex shader.
        varying vec2 v_texCoord;
            
        void main() {
          //gl_Position = vec4(a_pos, 1.0);
          //v_texCoord = a_texCoord;
          gl_Position = vec4(a_pos * 2.0, 1.0);
          v_texCoord = (gl_Position.xy + 1.0) / 2.0;
        }`,
      `precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D tex;

        vec4 process(vec2 uv);
        
        void main() {
            gl_FragColor = texture2D(tex, v_texCoord);
            //gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);
        }`
    );

    this.thumbnailProgram = prog;
  }

  createDummyTexture() {
    //let gl = this.canvas.getContext("webgl2");
    let gl = this.gl;
    if (!this.dummyTex) {
      this.dummyTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.dummyTex);
      // bind a dummy texture to suppress WebGL warning.
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 255])
      ); // red

      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  getNodeByName(exportName: string): DesignerNode {
    for (let node of this.nodes) {
      if (node.exportName == exportName) return node;
    }

    return null;
  }

  getNodeInputs(node: DesignerNode): NodeInput[] {
    let inputs: NodeInput[] = new Array();

    for (let con of this.conns) {
      if (con.rightNode == node) {
        let input = new NodeInput();
        input.name = con.rightNodeInput;
        input.node = con.leftNode;
        inputs.push(input);
      }
    }

    return inputs;
  }

  addVariable(
    name: string,
    displayName: string,
    varType: DesignerVariableType
  ): DesignerVariable {
    //todo: throw exception if variable already exists?

    let variable = new DesignerVariable();
    variable.type = varType;
    variable.id = Guid.newGuid();

    switch (varType) {
      case DesignerVariableType.Int:
        variable.property = new IntProperty(name, displayName, 0);
        break;
      case DesignerVariableType.Float:
        variable.property = new FloatProperty(name, displayName, 0);
        break;
      case DesignerVariableType.Bool:
        variable.property = new BoolProperty(name, displayName, false);
        break;
      case DesignerVariableType.Enum:
        variable.property = new EnumProperty(name, displayName, [], 0);
        break;
      case DesignerVariableType.Asset:
        variable.property = new AssetProperty(
          name,
          displayName,
          AssetType.Font
        );
        break;
      case DesignerVariableType.Color:
        variable.property = new ColorProperty(name, displayName, new Color());
        break;
    }

    this.variables.push(variable);
    return variable;
  }

  // todo: keep reference inside node's property
  mapNodePropertyToVariable(
    varName: string,
    node: DesignerNode,
    nodePropName: string
  ) {
    let variable = this.findVariable(varName);
    if (variable == null) return; //todo: throw exception?

    let map = new DesignerNodePropertyMap();
    map.node = node;
    map.propertyName = nodePropName;

    variable.nodes.push(map);
  }

  //todo: remove property map
  setVariable(name: string, value: any) {
    let variable = this.findVariable(name);
    if (variable) {
      //todo: throw exception for invalid types being set
      variable.property.setValue(value);

      //update each node's variables
      for (let nodeMap of variable.nodes) {
        //if (nodeMap.node.hasProperty(nodeMap.propertyName))// just incase
        nodeMap.node.setProperty(nodeMap.propertyName, value);
      }
    } else {
      // throw exception?
    }
  }

  findVariable(name: string) {
    for (let variable of this.variables)
      if (variable.property.name == name) return variable;
    return null;
  }

  hasVariable(name: string): boolean {
    for (let variable of this.variables)
      if (variable.property.name == name) return true;
    return false;
  }

  variableCount(): number {
    return this.variables.length;
  }

  save(): any {
    let outputNode: OutputNode = null;
    let nodes = new Array();
    for (let node of this.nodes) {
      let n = {};
      n["id"] = node.id;
      n["typeName"] = node.typeName;
      n["exportName"] = node.exportName;
      n["nodeType"] = node.nodeType;

      if (node instanceof TextureNode) {
        n["texPath"] = node.texPath;

        let imgCanvas = Editor.getScene().getNodeById(node.id).imageCanvas
          .canvas;
        n["imgDataURL"] = canvasToURL(imgCanvas);
      }

      let props = {};
      for (let prop of node.properties) {
        props[prop.name] = {};
        props[prop.name]["value"] = prop.getValue();
        props[prop.name]["exposed"] = prop.getExposed();
        props[prop.name]["displayName"] = prop.getDisplayName();

        // load child property
        if (prop.hasChildren) {
          for (let childProp of prop.children) {
            props[childProp.name] = {};
            props[childProp.name]["value"] = childProp.getValue();
            props[childProp.name]["exposed"] = childProp.getExposed();
            props[childProp.name]["displayName"] = childProp.getDisplayName();
          }
        }
      }
      n["properties"] = props;

      nodes.push(n);

      if (node instanceof OutputNode) outputNode = node;
    }

    let connections = new Array();
    for (let con of this.conns) {
      let c = {};
      c["id"] = con.id;
      c["leftNodeId"] = con.leftNode.id;
      c["leftNodeOutput"] = con.leftNodeOutput;
      c["rightNodeId"] = con.rightNode.id;
      c["rightNodeInput"] = con.rightNodeInput;

      connections.push(c);
    }

    let variables = new Array();
    for (let dvar of this.variables) {
      let v = {};
      v["id"] = dvar.id;
      v["type"] = dvar.type;
      v["property"] = dvar.property;

      let nodeIds = new Array();
      for (let n of dvar.nodes) {
        nodeIds.push({
          nodeId: n.node.id,
          name: n.propertyName,
        });
      }
      v["linkedProperties"] = nodeIds;
      variables.push(v);
      console.log(v);
    }

    let outputCanvas = Editor.getScene().getNodeById(outputNode.id).imageCanvas
      .canvas;

    let data = {};
    data["thumbnail"] = canvasToThumbnailURL(outputCanvas);
    data["nodes"] = nodes;
    data["connections"] = connections;
    data["variables"] = variables;
    return data;
  }

  static load(data: any, lib: DesignerLibrary): Designer {
    console.log(data);
    let d = new Designer();
    let nodes = data["nodes"];

    for (let node of nodes) {
      let n = lib.create(node["typeName"]);
      n.exportName = node["exportName"];
      n.id = node["id"];
      n.nodeType = node["nodeType"];

      if (n instanceof TextureNode) {
        n.setImageData(node["imgDataURL"], true);
      }

      // add node to it's properties will be initialized
      // todo: separate setting properties and inputs from setting shader in node
      d.addNode(n);

      // add properties
      let properties = node["properties"];
      for (let prop in properties) {
        n.setProperty(prop, properties[prop]);
      }

      if (n.onPropertyLoaded) {
        n.onPropertyLoaded();
      }
    }

    let connections = data["connections"];
    for (let con of connections) {
      //let c = d.addConnection()
      let left = d.getNodeById(con.leftNodeId);
      let right = d.getNodeById(con.rightNodeId);

      // todo: support left index
      d.addConnection(left, right, con.rightNodeInput);
    }

    if (data.variables) {
      let variables = <DesignerVariable[]>data.variables;
      for (let v of variables) {
        //this.addVariable(v.name, v.displayName, )

        let dvar = d.addVariable(
          v.property.name,
          v.property.displayName,
          v.type
        );
        dvar.id = v.id;
        // copy values over to the property
        switch (dvar.type) {
          case DesignerVariableType.Float:
            (<FloatProperty>dvar.property).copyValuesFrom(
              <FloatProperty>v.property
            );
            break;

          case DesignerVariableType.Int:
            (<IntProperty>dvar.property).copyValuesFrom(
              <IntProperty>v.property
            );
            break;

          case DesignerVariableType.Bool:
            (<BoolProperty>dvar.property).copyValuesFrom(
              <BoolProperty>v.property
            );
            break;

          case DesignerVariableType.Enum:
            (<EnumProperty>dvar.property).copyValuesFrom(
              <EnumProperty>v.property
            );
            break;

          case DesignerVariableType.Asset:
            (<AssetProperty>dvar.property).copyValuesFrom(
              <AssetProperty>v.property
            );
            break;

          case DesignerVariableType.Color:
            (<ColorProperty>dvar.property).copyValuesFrom(
              <ColorProperty>v.property
            );
            break;
        }

        // link properties
        for (let lp of (v as any).linkedProperties) {
          let node = d.getNodeById(lp.nodeId);
          d.mapNodePropertyToVariable(v.property.name, node, lp.name);
        }
      }
    }

    console.log("Designer Loaded");
    console.log(nodes.length + " nodes");
    console.log(connections.length + " connections");
    return d;
  }

  getThumbnail() {
    let outputNode = this.nodes.find((item) => item instanceof OutputNode);
    if (!outputNode) {
      console.error("Can not find output node, this sould not happen");
      return;
    } else {
      let outputCanvas = Editor.getScene().getNodeById(outputNode.id)
        .imageCanvas.canvas;
      return canvasToThumbnailURL(outputCanvas);
    }
  }

  findLeftNode(rightNodeId: string, rightNodeInput: string): DesignerNode {
    let conns = this.conns.filter(
      (conn) =>
        conn.rightNode.id === rightNodeId &&
        conn.rightNodeInput === rightNodeInput
    );

    let leftNode = null;

    if (conns.length > 0) leftNode = conns[0].leftNode;
    return leftNode;
  }

  findRightNodes(leftNodeId: string, leftNodeOutput: string): DesignerNode[] {
    let conn = this.conns.filter((conn) => conn.leftNode.id === leftNodeId);
    // && conn.leftNodeOutput === leftNodeOutput
    let rightNodes = [];

    for (let con of conn) {
      rightNodes.push(con.rightNode);
    }

    return rightNodes;
  }

  getConnections(node: DesignerNode) {
    return this.conns.filter(
      (con) => con.leftNode == node || con.rightNode == node
    );
  }
}
