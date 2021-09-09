// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { NodeCategory, NodeType } from "@/lib/designer/designernode";
import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
import { loadGif, UpdateTexture } from "@/lib/utils";
import { Property, FileProperty } from "@/lib/designer/properties";
import { Editor } from "@/lib/editor";
import { BitmapImage, GifFrame, GifUtil, GifCodec } from "gifwrap";
//const { GifFrame, GifUtil, GifCodec } = require('gifwrap');

export class AnimationNode extends ImageDesignerNode {
  protected bmp: Uint8Array = null;
  protected imgWidth: number = 0;
  protected imgHeight: number = 0;
  protected frameCount: number = 1;
  protected currentFrameIndex: number = 0;
  animation: any;
  progressProp: Property;

  // constructor
  constructor() {
    super();
    this.isDataUrl = false;
    this.nodeType = NodeType.Texture;
    this.nodeCategory = NodeCategory.Create;

    this.onnodepropertychanged = (prop: Property) => {
      if (prop.name === "file") {
        this.isDataUrl = false;
        this.texPath = (prop as FileProperty).value;
        if (this.texPath) {
          this.load();
        }
      } else if (prop.name === "progress") {
        const idx = this.frameIndex;
        if (this.currentFrameIndex != idx) {
          this.currentFrameIndex = idx;
          this.imgWidth;
          this.imgHeight;

          this.bmp = this.getFrame(this.currentFrameIndex);
          this.createTexture();
          this.requestUpdate();
        }
      }
    };
  }

  get progress() {
    return this.getPropertyValueByName("progress");
  }

  get frameIndex() {
    return Math.floor((this.frameCount - Number.EPSILON) * this.progress);
  }

  load() {
    let target = this.isDataUrl ? this.imgData : this.texPath;
    if (!target) return;

    loadGif(target, this.isDataUrl).then((animation: any) => {
      if (!animation) return;

      this.animation = animation;
      this.frameCount = this.animation.frames.length;
      this.imgWidth = this.animation.width;
      this.imgHeight = this.animation.height;

      this.animation.frames.forEach((frame) => {
        if (
          this.imgWidth != frame.width ||
          this.imgHeight != frame.height ||
          frame.xOffset > 0 ||
          frame.yOffset > 0
        ) {
          frame.reframe(
            -frame.xOffset,
            -frame.yOffset,
            this.imgWidth,
            this.imgHeight,
            "0x00000000"
          );
          frame.xOffset = 0;
          frame.yOffset = 0;
        }
      });

      this.resize(this.imgWidth, this.imgHeight);

      this.bmp = this.getFrame(this.currentFrameIndex);

      this.createTexture();
      this.requestUpdate();
    });
  }

  getFrame(idx: number) {
    if (idx < 0 || idx >= this.animation.frames.length) {
      console.warn("Invalid frame index");
      // empty image
      return null;
    }

    return this.animation.frames[idx].bitmap.data;
  }

  getImageData() {
    if (!this.imgData) {
      this.imgData = Editor.getScene()
        .getNodeById(this.id)
        .imageCanvas.canvas.toDataURL();
    }
    return this.imgData;
  }

  setImageData(imgDataURL: any, isUrl: boolean) {
    this.imgData = imgDataURL;
    this.isDataUrl = isUrl;
    this.load();
  }

  createTexture() {
    if (!this.bmp) return;
    const gl = this.gl;
    this.isTextureReady = false;

    if (this.tex) {
      gl.deleteTexture(this.tex);
      this.tex = null;
    }

    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const nodetype = this.nodeType;
    let data = null;

    this.width = this.imgWidth;
    this.height = this.imgHeight;

    this.tex = UpdateTexture(
      level,
      internalFormat,
      this.imgWidth,
      this.imgHeight,
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
      this.imgWidth,
      this.imgHeight,
      border,
      format,
      type,
      Uint8Array.from(this.bmp),
      NodeType.Texture,
      this.gl,
      false,
      true
    );
    this.isTextureReady = true;
    this.requestUpdate();
  }

  init() {
    this.title = "Animation";
    let fileProp = this.addFileProperty("file", "path", "", ["gif", "webp"]);

    // this happens when we drop image file into canvas
    if (this.texPath !== "") {
      this.setProperty(fileProp.name, { value: this.texPath, exposed: false });
    }

    this.progressProp = this.addFloatProperty(
      "progress",
      "Progress",
      0.0,
      0.0,
      1.0,
      0.0001
    );

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

    if ((!this.isDataUrl && this.texPath) || (this.isDataUrl && this.imgData)) {
      this.load();
    }
  }
}
