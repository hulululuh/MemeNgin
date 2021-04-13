import { NodeCategory, NodeType } from "@/lib/designer/designernode";
import {
  ImageDesignerNode,
  UpdateTexture,
} from "@/lib/designer/imagedesignernode";
import { Property, FileProperty } from "@/lib/designer/properties";
import { Editor } from "@/lib/editor";
import path from "path";

const isDataUri = require("is-data-uri");
const NativeImage = require("electron").nativeImage;

async function loadLocalWebp(path: string) {
  let blob = await fetch(path).then((r) => r.blob());
  let reader = new FileReader();
  await reader.readAsDataURL(blob);
  let dataUrl = reader.result.toString();

  if (isDataUri(dataUrl)) {
    let img = NativeImage.createFromDataURL(dataUrl);
    return img;
  } else {
    console.warn("something went wrong loading local webp file");
  }
}

async function loadImage(imgPath: string, isDataUrl: boolean) {
  let img = null;

  if (isDataUrl) {
    img = new Image();
    img.src = imgPath;
    await img.decode();

    let canvas = <HTMLCanvasElement>document.createElement("canvas");
    let context = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
    let bitmap = context.getImageData(0, 0, img.width, img.height);

    return NativeImage.createFromBitmap(bitmap.data, {
      width: img.width,
      height: img.height,
    });
  } else {
    const ext = path.extname(imgPath).toLowerCase();
    if (ext === ".webp") {
      //img = await loadLocalWebp(imgPath);
      console.warn("local webp image is not supported yet.");
    } else {
      img = NativeImage.createFromPath(imgPath);
    }
  }
  return img;
}

export class TextureNode extends ImageDesignerNode {
  protected bmp: Uint8Array = null;
  protected imgWidth: number = 0;
  protected imgHeight: number = 0;
  isUrl: boolean = false;

  // constructor
  constructor() {
    super();
    this.nodeType = NodeType.Texture;
    this.nodeCategory = NodeCategory.Create;

    this.onnodepropertychanged = (prop: Property) => {
      if (prop.name === "file") {
        this.isUrl = false;
        this.texPath = (prop as FileProperty).value;
        if (this.texPath) {
          this.loadTexture();
        }
      }
    };
  }

  loadTexture() {
    let target = this.isUrl ? this.imgData : this.texPath;
    if (!target) return;

    loadImage(target, this.isUrl).then((img) => {
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

  setImageData(imgDataURL: string, isUrl: boolean) {
    this.imgData = imgDataURL;
    this.isUrl = isUrl;
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
      !this.isUrl,
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

    this.loadTexture();
  }
}
