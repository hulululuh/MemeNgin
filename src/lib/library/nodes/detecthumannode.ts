// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] refernced from PeterL1n@github's RobustVideoMatting

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
import { UpdateTexture } from "@/lib/utils";
import { DesignerNode, NodeType } from "@/lib/designer/designernode";
import { Editor } from "@/lib/editor";
import * as tf from "@tensorflow/tfjs";

export class DetectHumanNode extends ImageDesignerNode {
  static verticesBuffer: WebGLBuffer;
  static vertices: number[];
  static model: any = null;

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

    if (!DetectHumanNode.model) {
      DetectHumanNode.CreateModel();
    }
  }

  static async CreateModel() {
    DetectHumanNode.model = await tf.loadGraphModel(
      `assets/tensorflow-models/RobustVideoMatting/model.json`
    );
  }

  async createTexture() {
    // if segmentation ready, skip update this node.
    if (!this.isAsyncWorkPending) {
      return;
    }

    let gl = this.gl;
    this.isTextureReady = false;

    if (!DetectHumanNode.verticesBuffer) {
      // init buffer for rect
      DetectHumanNode.verticesBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, DetectHumanNode.verticesBuffer);

      DetectHumanNode.vertices = [
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
        new Float32Array(DetectHumanNode.vertices),
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

    let resultImg: ImageData = await this.draw(canvas);

    // create texture for debug
    if (resultImg) {
      if (!this.isTextureReady) {
        const w = resultImg.width;
        const h = resultImg.height;
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
          w,
          h,
          border,
          format,
          type,
          Uint8Array.from(resultImg.data),
          NodeType.Texture,
          this.gl,
          false,
          true
        );

        this.isTextureReady = true;
        this.isAsyncWorkPending = false;
        //this.resize(w, h);
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

  init() {
    this.title = "Detect Human";
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

  async draw(inputCanvas: HTMLCanvasElement): Promise<any> {
    try {
      const model = DetectHumanNode.model;

      // Set initial recurrent state
      let [r1i, r2i, r3i, r4i] = [
        tf.tensor(0),
        tf.tensor(0),
        tf.tensor(0),
        tf.tensor(0),
      ];

      // Set downsample ratio
      const downsample_ratio = tf.tensor(0.5);

      // Inference
      const img = tf.browser.fromPixels(inputCanvas);
      const src = tf.tidy(() => img.expandDims(0).div(255)); // normalize input
      const [fgr, pha, r1o, r2o, r3o, r4o]: any = await model.executeAsync(
        { src, r1i, r2i, r3i, r4i, downsample_ratio }, // provide inputs
        ["fgr", "pha", "r1o", "r2o", "r3o", "r4o"] // select outputs
      );

      const targetCanvas = Editor.getScene().getNodeById(this.id).imageCanvas
        .canvas;

      let imageData;
      if (targetCanvas) {
        imageData = await this.drawMatte(
          fgr.clone(),
          pha.clone(),
          targetCanvas
        );
      }

      // Dispose old tensors.
      tf.dispose([img, src, fgr, pha, r1i, r2i, r3i, r4i]);

      // Update recurrent states.
      [r1i, r2i, r3i, r4i] = [r1o, r2o, r3o, r4o];

      return imageData;
    } catch (err) {
      console.error(err);
    }
  }

  async drawMatte(fgr, pha, canvas) {
    const rgba = tf.tidy(() => {
      const rgb =
        fgr !== null
          ? fgr
              .squeeze(0)
              .mul(255)
              .cast("int32")
          : tf.fill([pha.shape[1], pha.shape[2], 3], 255, "int32");
      const a =
        pha !== null
          ? pha
              .squeeze(0)
              .mul(255)
              .cast("int32")
          : tf.fill([fgr.shape[1], fgr.shape[2], 1], 255, "int32");
      return tf.concat([rgb, a], -1);
    });
    fgr && fgr.dispose();
    pha && pha.dispose();
    const [height, width] = rgba.shape.slice(0, 2);
    const pixelData = new Uint8ClampedArray(await rgba.data());
    const imageData = new ImageData(pixelData, width, height);
    // canvas.width = width;
    // canvas.height = height;
    // canvas.getContext("2d").putImageData(imageData, 0, 0);
    rgba.dispose();

    return imageData;
  }

  async drawHidden(r, canvas) {
    const rgba = tf.tidy(() => {
      r = r.unstack(-1);
      r = tf.concat(r, 1);
      r = r.split(4, 1);
      r = tf.concat(r, 2);
      r = r.squeeze(0);
      r = r.expandDims(-1);
      r = r
        .add(1)
        .mul(127.5)
        .cast("int32");
      r = r.tile([1, 1, 3]);
      r = tf.concat(
        [r, tf.fill([r.shape[0], r.shape[1], 1], 255, "int32")],
        -1
      );
      return r;
    });
    const [height, width] = rgba.shape.slice(0, 2);
    const pixelData = new Uint8ClampedArray(await rgba.data());
    const imageData = new ImageData(pixelData, width, height);
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").putImageData(imageData, 0, 0);
    rgba.dispose();
  }
}
