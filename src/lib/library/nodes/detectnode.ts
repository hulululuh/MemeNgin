// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
import { UpdateTexture } from "@/lib/utils";
import { DesignerNode, NodeType } from "../../designer/designernode";
import { Editor } from "@/lib/editor";

import { DeepLabOutput } from "@tensorflow-models/deeplab/dist/types";
import * as deeplab from "@tensorflow-models/deeplab";
import path from "path";

const NativeImage = require("electron").nativeImage;
const appPath = require("electron").remote.app.getAppPath();
const modelPath = path.normalize(
  appPath +
    "/../src/assets/tensorflow/deeplabv3_pascal_trainval/frozen_inference_graph.pb"
);

const customModel: boolean = false;
const loadModel = async () => {
  if (!customModel) {
    const modelName = "pascal"; // set to your preferred model, either `pascal`, `cityscapes` or `ade20k`
    const quantizationBytes = 2; // either 1, 2 or 4
    return await deeplab.load({ base: modelName, quantizationBytes });
  } else {
    return await deeplab.load({ modelUrl: modelPath });
  }
};

export class DetectNode extends ImageDesignerNode {
  protected output: Promise<DeepLabOutput>;
  protected inferenceTime: number;
  protected sessionRunning: boolean;
  static verticesBuffer: WebGLBuffer;
  static vertices: number[];
  static model: deeplab.SemanticSegmentation;

  constructor() {
    super();
    this.nodeType = NodeType.Texture;

    this.createTextureAsync = async () => {
      this.isAsyncWorkPending = true;
      await this.createTexture();
      return this;
    };

    this.ondisconnected = (node: DesignerNode, name: string) => {
      if (name === "image") {
        const gl = this.gl;
        this.isTextureReady = false;
      }
    };
  }

  static loadModelAsync() {
    loadModel().then((model) => {
      DetectNode.model = model;
    });
  }

  async createTexture() {
    // if segmentation ready, skip update this node.
    if (!this.isAsyncWorkPending) {
      return;
    }

    let gl = this.gl;
    this.isTextureReady = false;

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
    let leftNode = designer.findLeftNode(this.id, "image") as ImageDesignerNode;
    if (!leftNode) {
      // abort - no connected input yet
      return;
    }
    const canvas = Editor.getScene().getNodeById(leftNode.id).imageCanvas
      .canvas;
    const imageData = canvas
      .getContext("2d")
      .getImageData(0, 0, this.width, this.height);

    // *********** deeplab ***********
    let output = await this.doSegmentation(imageData);
    if (output.segmentationMap.length > 1) {
      let resultImg = NativeImage.createFromBuffer(
        Buffer.from(output.segmentationMap.buffer),
        { width: output.width, height: output.height }
      );

      const w = this.getWidth();
      const h = this.getHeight();

      let bitmap = resultImg.getBitmap();
      const n = bitmap.length;

      for (let idx = 0; idx < n / 4; idx++) {
        const pixelIdx = idx * 4;
        const iR = pixelIdx + 0;
        const iG = pixelIdx + 1;
        const iB = pixelIdx + 2;
        const iA = pixelIdx + 3;

        // make background pixel transparent
        if (bitmap[iR] == 0 && bitmap[iG] == 0 && bitmap[iB] == 0) {
          bitmap[iA] = 0;
        }
      }

      resultImg = NativeImage.createFromBuffer(bitmap, {
        width: output.width,
        height: output.height,
      });

      // create texture for debug
      if (resultImg) {
        if (!this.isTextureReady) {
          this.tex = UpdateTexture(
            level,
            internalFormat,
            w,
            h,
            border,
            format,
            type,
            data,
            NodeType.Procedural,
            this.gl
          );
          this.baseTex = UpdateTexture(
            level,
            internalFormat,
            output.width,
            output.height,
            border,
            format,
            type,
            Uint8Array.from(resultImg.getBitmap()),
            NodeType.Texture,
            this.gl,
            false,
            true
          );

          this.isTextureReady = true;
          this.isAsyncWorkPending = false;
          this.resize(w, h);
          //this.requestUpdate();
        }
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

    this.tex = UpdateTexture(
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

  async doSegmentation(imageData: ImageData) {
    if (!DetectNode.model) {
      DetectNode.model = await loadModel();
    }
    return await DetectNode.model.segment(imageData);
  }

  init() {
    this.title = "Detect";
    this.addInput("image");

    let source = `
        vec4 process(vec2 uv)
        {
          vec4 col = texture(image, uv);
          if (baseTexture_ready) {
            col.a = texture(baseTexture, uv).a;
          }
          return col;
        }
        `;

    this.buildShader(source);
  }
}
