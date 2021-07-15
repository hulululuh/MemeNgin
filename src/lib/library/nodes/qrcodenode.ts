// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { NodeCategory, NodeType } from "@/lib/designer/designernode";
import {
  ImageDesignerNode,
  UpdateTexture,
} from "@/lib/designer/imagedesignernode";
import { DesignerNode } from "@/lib/designer/designernode";
import { Property } from "@/lib/designer/properties";
import QRCode from "qrcode";
const NativeImage = require("electron").nativeImage;

async function loadImage(input: string) {
  let qrInput = input.length === 0 ? " " : input;
  try {
    let qrUrl = await QRCode.toDataURL(qrInput);
    return NativeImage.createFromDataURL(qrUrl);
  } catch (err) {
    console.log(err);
  }

  return null;
}

export class QrCodeNode extends ImageDesignerNode {
  protected bmp: Uint8Array = null;
  protected imgWidth: number = 0;
  protected imgHeight: number = 0;
  protected text: string = "";

  // constructor
  constructor() {
    super();
    this.nodeType = NodeType.Texture;
    this.nodeCategory = NodeCategory.Create;

    this.onnodepropertychanged = (prop: Property) => {
      if (prop.name === "text") {
        this.text = this.getProperty(prop.name);
        this.loadTexture();
      }
    };
  }

  loadTexture() {
    loadImage(this.text).then((img) => {
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
    this.title = "QR Code";
    this.addStringProperty("text", "Text");

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

    this.onConnected = (leftNode: DesignerNode, rightIndex: string) => {
      if (rightIndex === "text") {
        this.text = this.getProperty("text");
        this.loadTexture();
      }
    };

    this.ondisconnected = (leftNode: DesignerNode, rightIndex: string) => {
      if (rightIndex === "text") {
        this.text = this.getProperty("text");
        this.loadTexture();
      }
    };

    this.buildShader(source);

    this.loadTexture();
  }
}
