import { DesignerNode, NodeType } from "../../designer/designernode";
import { Color } from "@/lib/designer/color";
import { SphereBufferGeometry } from "@/lib/geometry/sphere";
import { Property, FileProperty } from "@/lib/designer/properties";
const NativeImage = require("electron").nativeImage;

export class TextureNode extends DesignerNode {
  // constructor
  constructor() {
    super();
    this.nodeType = NodeType.Texture;

    this.onnodepropertychanged = (prop: Property) => {
      if (prop.name === "file") {
        if (prop) {
          this.texPath = (prop as FileProperty).value;
          this.createTexture();
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

    if (this.texPath) {
      const image = NativeImage.createFromPath(this.texPath);
      if (image.isEmpty() === false) {
        this.tex = DesignerNode.updateTexture(
          level,
          internalFormat,
          this.designer.width,
          this.designer.height,
          border,
          format,
          type,
          data,
          NodeType.Procedural,
          this.gl
        );
        const imgSize = image.getSize();
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
        this.requestUpdate();
      }
    }
  }

  public init() {
    this.title = "Image Texture";
    let fileProp = this.addFileProperty("file", "path");

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
