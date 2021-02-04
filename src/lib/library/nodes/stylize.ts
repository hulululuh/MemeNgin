import { DesignerNode, NodeType } from "../../designer/designernode";
import {
  ImageDesignerNode,
  UpdateTexture,
} from "@/lib/designer/imagedesignernode";
import * as mi from "@magenta/image";

const NativeImage = require("electron").nativeImage;

export class StylizeNode extends ImageDesignerNode {
  static verticesBuffer: WebGLBuffer;
  static vertices: number[];

  static model: mi.ArbitraryStyleTransferNetwork = null;
  protected contentImg: ImageData = null;
  protected styleImg: ImageData = null;

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
        gl.uniform1i(
          gl.getUniformLocation(this.shaderProgram, "baseTexture_ready"),
          0
        );
      }
    };
  }

  convertToImageDataByName(inputName: string): ImageData {
    const inputNode = this.designer.findLeftNode(
      this.id,
      inputName
    ) as ImageDesignerNode;
    if (inputNode) {
      return this.convertToImageData(inputNode);
    } else {
      return null;
    }
  }

  convertToImageData(node: ImageDesignerNode): ImageData {
    const gl = this.gl;

    const texW = node.getWidth();
    const texH = node.getHeight();

    let readPixelBuffer = new Uint8Array(texW * texH * 4);
    let readPixelCompleted = false;
    let fb = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      node.tex,
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

    const imageData: ImageData = new ImageData(
      Uint8ClampedArray.from(img.getBitmap()),
      texW,
      texH
    );

    return imageData;
  }

  async createTexture() {
    if (!this.isAsyncWorkPending) {
      return;
    }

    let gl = this.gl;
    this.isTextureReady = false;

    if (!StylizeNode.verticesBuffer) {
      // init buffer for rect
      StylizeNode.verticesBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, StylizeNode.verticesBuffer);

      StylizeNode.vertices = [
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
        new Float32Array(StylizeNode.vertices),
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

    this.contentImg = this.convertToImageDataByName("image");
    this.styleImg = this.convertToImageDataByName("style");
    if (!this.contentImg || !this.styleImg) return;

    if (!StylizeNode.model) {
      StylizeNode.model = new mi.ArbitraryStyleTransferNetwork();
    }

    if (!StylizeNode.model.isInitialized()) {
      await StylizeNode.model.initialize();
    }

    let self = this;
    await StylizeNode.model
      .stylize(this.contentImg, this.styleImg)
      .then((imageData) => {
        let parentNode = self.getParentNode();
        if (imageData && parentNode) {
          const w = parentNode.getWidth();
          const h = parentNode.getHeight();
          // create texture for debug
          if (!self.isTextureReady) {
            self.tex = UpdateTexture(
              level,
              internalFormat,
              w,
              h,
              border,
              format,
              type,
              data,
              NodeType.Procedural,
              self.gl
            );
            self.baseTex = UpdateTexture(
              level,
              internalFormat,
              imageData.width,
              imageData.height,
              border,
              format,
              type,
              Uint8Array.from(imageData.data),
              NodeType.Texture,
              self.gl,
              false,
              false
            );

            self.isTextureReady = true;
            self.isAsyncWorkPending = false;
            self.resize(w, h);
            //this.requestUpdate();
            StylizeNode.model.dispose();
            delete StylizeNode.model;
          }
        }
      });
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
    this.title = "Stylize";
    this.addInput("image");
    this.addInput("style");

    let source = `
        vec4 process(vec2 uv)
        {
          vec4 col = texture(image, uv);
          if (baseTexture_ready) {
            col.rgb = texture(baseTexture, uv).rgb;
          }
          return col;
        }
        `;

    this.buildShader(source);
  }
}
