import { NodeCategory, NodeType } from "@/lib/designer/designernode";
import {
  ImageDesignerNode,
  UpdateTexture,
} from "@/lib/designer/imagedesignernode";
import { Property, FileProperty } from "@/lib/designer/properties";
import path from "path";

const fs = require("fs");
const NativeImage = require("electron").nativeImage;

function loadImage(imgPath: string) {
  const ext = path.extname(imgPath).toLowerCase();
  let img = null;
  let w = 0;
  let h = 0;

  if (ext === ".webp") {
    console.warn("webp - currently not supported");
    return [null, 0, 0];
  } else {
    img = NativeImage.createFromPath(imgPath);
    const size = img.getSize();
    w = size.width;
    h = size.height;
    return [img.getBitmap(), w, h];
  }
}

export class TextureNode extends ImageDesignerNode {
  protected bmp: Uint8Array = null;
  protected imgWidth: number = 0;
  protected imgHeight: number = 0;

  // constructor
  constructor() {
    super();
    this.nodeType = NodeType.Texture;
    this.nodeCategory = NodeCategory.Create;

    this.onnodepropertychanged = (prop: Property) => {
      if (prop.name === "file") {
        if (prop) {
          this.texPath = (prop as FileProperty).value;
          if (this.texPath) {
            [this.bmp, this.imgWidth, this.imgHeight] = loadImage(this.texPath);

            if (!this.bmp) {
              console.log("load image failed");
            }
            this.resize(this.imgWidth, this.imgHeight);
            this.createTexture();
            this.requestUpdate();
          }
        }
      }
    };
  }

  createTexture() {
    let gl = this.gl;
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

    if (!this.bmp && this.texPath) {
      [this.bmp, this.imgWidth, this.imgHeight] = loadImage(this.texPath);

      if (!this.bmp) {
        console.log("load image failed");
        return;
      }
    }

    if (this.bmp) {
      if (this.bmp.length > 0) {
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
          true,
          true
        );
        this.isTextureReady = true;
        this.requestUpdate();
      }
    }
  }

  init() {
    this.title = "Image Texture";
    let fileProp = this.addFileProperty("file", "path", "", ["jpg", "png"]);

    // this happens when we drop image file into canvas
    if (this.texPath !== "") {
      fileProp.setValue(this.texPath);
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
  }
}
