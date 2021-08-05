// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { NodeCategory, NodeType } from "@/lib/designer/designernode";
import {
  ImageDesignerNode,
  UpdateTexture,
} from "@/lib/designer/imagedesignernode";
import { Property, FileProperty } from "@/lib/designer/properties";
import { Editor } from "@/lib/editor";
import { loadImage } from "@/lib/utils";

export class TextureNode extends ImageDesignerNode {
  protected bmp: Uint8Array = null;
  protected imgWidth: number = 0;
  protected imgHeight: number = 0;
  isDataUrl: boolean = false;

  // constructor
  constructor() {
    super();
    this.nodeType = NodeType.Texture;
    this.nodeCategory = NodeCategory.Create;

    this.onnodepropertychanged = (prop: Property) => {
      if (prop.name === "file") {
        this.isDataUrl = false;
        this.texPath = (prop as FileProperty).value;
        if (this.texPath) {
          this.loadTexture();
        }
      }
    };
  }

  loadTexture() {
    let target = this.isDataUrl ? this.imgData : this.texPath;
    if (!target) return;

    loadImage(target, this.isDataUrl).then((img) => {
      if (!img) return;
      this.bmp = img.getBitmap();
      const size = img.getSize();
      this.imgWidth = size.width;
      this.imgHeight = size.height;

      if (!this.bmp) {
        console.log("load image failed");
      }
      this.resize(this.imgWidth, this.imgHeight);
      this.createTexture();
      this.requestUpdate();
    });
  }

  getImageData() {
    if (!this.imgData) {
      this.imgData = Editor.getScene()
        .getNodeById(this.id)
        .imageCanvas.canvas.toDataURL();
    }
    return this.imgData;
  }

  setImageData(imgDataURL: string, isUrl: boolean) {
    this.imgData = imgDataURL.repeat(1);
    this.isDataUrl = isUrl;
    this.loadTexture();
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
      !this.isDataUrl,
      true
    );
    this.isTextureReady = true;
    this.requestUpdate();
  }

  init() {
    this.title = "Image Texture";
    let fileProp = this.addFileProperty("file", "path", "", ["jpg", "png"]);

    // this happens when we drop image file into canvas
    if (this.texPath !== "") {
      this.setProperty(fileProp.name, { value: this.texPath, exposed: false });
    }

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
      this.loadTexture();
    }
  }
}
