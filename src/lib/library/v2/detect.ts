import { DesignerNode, NodeInput, NodeType } from "../../designer/designernode";
import { Property, FileProperty } from "@/lib/designer/properties";
import { Tensor, InferenceSession } from "onnxjs";
import { Editor } from "@/lib/editor";

import ndarray from "ndarray";
import ops from "ndarray-ops";

import * as runModelUtils from "@/lib/utils/runModel";
import * as yoloTransforms from "@/lib/utils/utils-yolo/yoloPostprocess";
import * as yolo from "@/lib/utils/yolo";

const NativeImage = require("electron").nativeImage;

const targetW = 416;
const targetH = 416;

export class YoloBox {
  top: number;
  left: number;
  bottom: number;
  right: number;
  classProb: number;
  className: string;
}

export class DetectNode extends DesignerNode {
  protected img: Electron.NativeImage;
  protected output: Tensor.DataType;
  protected inferenceTime: number;
  protected sessionRunning: boolean;
  protected boxes: YoloBox[];
  static verticesBuffer: WebGLBuffer;
  static vertices: number[];

  constructor() {
    super();
    this.nodeType = NodeType.Texture;

    this.onnodepropertychanged = (prop: Property) => {
      if (prop.name === "file") {
        if (prop) {
          this.texPath = (prop as FileProperty).value;
          if (this.texPath) {
            this.img = NativeImage.createFromPath(this.texPath);
            const imgSize = this.img.getSize();
            this.resize(imgSize.width, imgSize.height);
            this.createTexture();
            this.requestUpdate();
          }
        }
      }
    };

    this.ondisconnected = (node: DesignerNode, name: string) => {
      if (name === "image") {
        const gl = this.gl;
        this.isTextureReady = false;
        gl.uniform1i(
          gl.getUniformLocation(this.shaderProgram, "baseTexture_ready"),
          0
        );

        let graphicsItem = Editor.getInstance().nodeScene.nodes.filter(
          (x) => x.id == this.id
        )[0];
        graphicsItem.helperViz = [];
      }
    };
  }

  preprocess(data: Uint8ClampedArray, width: number, height: number): Tensor {
    // data processing
    const dataTensor = ndarray(new Float32Array(data), [width, height, 4]);
    const dataProcessedTensor = ndarray(new Float32Array(width * height * 3), [
      1,
      3,
      width,
      height,
    ]);

    ops.assign(
      dataProcessedTensor.pick(0, 0, null, null),
      dataTensor.pick(null, null, 0)
    );
    ops.assign(
      dataProcessedTensor.pick(0, 1, null, null),
      dataTensor.pick(null, null, 1)
    );
    ops.assign(
      dataProcessedTensor.pick(0, 2, null, null),
      dataTensor.pick(null, null, 2)
    );

    const tensor = new Tensor(new Float32Array(3 * width * height), "float32", [
      1,
      3,
      width,
      height,
    ]);
    (tensor.data as Float32Array).set(dataProcessedTensor.data);
    return tensor;
  }

  async postprocess(tensor: Tensor, inferenceTime: number) {
    try {
      const originalOutput = new Tensor(
        tensor.data as Float32Array,
        "float32",
        [1, 125, 13, 13]
      );
      const outputTensor = yoloTransforms.transpose(originalOutput, [
        0,
        2,
        3,
        1,
      ]);

      // postprocessing
      let boxes = await yolo.postprocess(outputTensor, 20);
      let graphicsItem = Editor.getInstance().nodeScene.nodes.filter(
        (x) => x.id == this.id
      )[0];
      //graphicsItem.helperViz = [];

      let helpers: YoloBox[] = [];

      boxes.forEach((box) => {
        const ratioW = this.width / targetW;
        const ratioH = this.height / targetH;

        const l = ratioW * box.left;
        const r = ratioW * box.right;
        const b = ratioH * box.bottom;
        const t = ratioH * box.top;

        const boxTransformed = {
          top: t,
          left: l,
          bottom: b,
          right: r,
          classProb: box.classProb,
          className: box.className,
        };
        helpers.push(boxTransformed);
      });

      graphicsItem.helperViz = helpers;
    } catch (e) {
      alert("Model is not valid!");
    }
  }

  createTexture() {
    let gl = this.gl;

    if (!DetectNode.verticesBuffer) {
      // init buffer for rect
      DetectNode.verticesBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, DetectNode.verticesBuffer);

      DetectNode.vertices = [
        1.0,
        1.0,
        0.0,
        -1.0,
        1.0,
        0.0,
        1.0,
        -1.0,
        0.0,
        -1.0,
        -1.0,
        0.0,
      ];

      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(DetectNode.vertices),
        gl.STATIC_DRAW
      );
    }

    if (this.tex) {
      gl.deleteTexture(this.tex);
      this.tex = null;
    }

    if (this.baseTex) {
      gl.deleteTexture(this.baseTex);
      this.baseTex = null;
    }

    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const nodetype = this.nodeType;
    let data = null;

    this.clearTexture();
    const designer = Editor.getDesigner();

    if (!designer) {
      console.log("could not find designer");
      return;
    }

    // 1. Find if there are input node
    let leftNode = designer.findLeftNode(this.id, "image");
    if (!leftNode) {
      // abort - no connected input yet
      return;
    }

    // tinyyolov2-7.onnx - [0, 3, 416, 416]
    const texW = leftNode.getWidth();
    const texH = leftNode.getHeight();

    let readPixelBuffer = new Uint8Array(texW * texH * 4);
    let readPixelCompleted = false;
    let fb = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      leftNode.tex,
      0
    );
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE) {
      gl.readPixels(
        0,
        0,
        texW,
        texH,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        readPixelBuffer
      );
      readPixelCompleted = true;
    }

    if (!readPixelCompleted) {
      return;
    }

    let img = NativeImage.createFromBuffer(
      Buffer.from(readPixelBuffer.buffer),
      { width: texW, height: texH }
    );

    // convert and resize input image
    let imgResized = img.resize({ width: targetW, height: targetH });
    let resizedBuffer = Uint8ClampedArray.from(imgResized.getBitmap());

    // 2. convert input image to tensor, setup ML session
    let tensor = this.preprocess(resizedBuffer, targetW, targetH);

    // 3. run ML session
    let tensorOutput = null;
    tensorOutput = this.runSession(tensor);

    // 4. retrieve and visualize results

    // create texture for debug
    if (img) {
      this.img = img;
      const image = img;
      const imgSize = image.getSize();
      if (image.isEmpty() === false) {
        this.width = imgSize.width;
        this.height = imgSize.height;

        this.tex = DesignerNode.updateTexture(
          level,
          internalFormat,
          imgSize.width,
          imgSize.height,
          border,
          format,
          type,
          data,
          NodeType.Procedural,
          this.gl
        );
        this.baseTex = DesignerNode.updateTexture(
          level,
          internalFormat,
          imgSize.width,
          imgSize.height,
          border,
          format,
          type,
          Uint8Array.from(image.getBitmap()),
          NodeType.Texture,
          this.gl
        );
        this.isTextureReady = true;
        this.resize(imgSize.width, imgSize.height);
        this.requestUpdate();
      }
    }
  }

  clearTexture() {
    const gl = this.gl;

    if (!gl) {
      return;
    }

    const imgSize: number[] = [this.width, this.height];
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const nodetype = this.nodeType;
    let data = null;

    this.tex = DesignerNode.updateTexture(
      level,
      internalFormat,
      imgSize[0],
      imgSize[1],
      border,
      format,
      type,
      data,
      NodeType.Procedural,
      this.gl
    );

    this.isTextureReady = false;
  }

  async runSession(preprocessedData: Tensor): Promise<Tensor> {
    let tensorOutput = null;
    let session = Editor.getInstance().mlModel.session;
    [tensorOutput, this.inferenceTime] = await runModelUtils.runModel(
      session!,
      preprocessedData
    );
    this.output = tensorOutput.data;
    this.postprocess(tensorOutput, 0);
    this.sessionRunning = false;
    return tensorOutput;
  }

  init() {
    this.title = "Detect";
    this.addInput("image");
    //let fileProp = this.addFileProperty("file", "path", "", ["jpg", "png"]);

    // this happens when we drop image file into canvas
    // if (this.texPath !== "") {
    //   fileProp.setValue(this.texPath);
    // }

    let source = `
        vec4 process(vec2 uv)
        {
          vec4 col = vec4(0,1,0,1);
          if (baseTexture_ready) {
            col = texture(baseTexture, uv);
          } else {
            col = vec4(uv.x, uv.y, 0.0, 1.0);
          }
          return col;
        }
        `;

    this.buildShader(source);
  }
}
