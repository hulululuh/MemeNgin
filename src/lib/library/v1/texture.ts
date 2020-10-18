import { DesignerNode, NodeType } from "../../designer/designernode";
import { Color } from "@/lib/designer/color";
import { SphereBufferGeometry } from "@/lib/geometry/sphere";
import { Property, FileProperty } from "@/lib/designer/properties";
//import * as NativeImage from "@electron/nativeImage";
const NativeImage = require("electron").nativeImage;

export class TextureNode extends DesignerNode {
  protected img: Electron.NativeImage;

  // constructor
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
      // else if (propName === "size") {
      //   //this.createTexture();
      // }
    };
  }

  public createTexture() {
    let gl = this.gl;

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

    if (!this.img && this.texPath) {
      this.img = NativeImage.createFromPath(this.texPath);
    }

    if (this.img) {
      const image = this.img;
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
          this.gl,
          true,
          true,
        );
        this.isTextureReady = true;
        this.requestUpdate();
      }
    }
  }

  public init() {
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
