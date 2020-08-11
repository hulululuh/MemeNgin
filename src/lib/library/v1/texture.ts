import { DesignerNode, NodeType } from "../../designer/designernode";
import { Color } from "@/lib/designer/color";
import { SphereBufferGeometry } from "@/lib/geometry/sphere";
const NativeImage = require("electron").nativeImage;

export class TextureNode extends DesignerNode {
  // constructor
  constructor() {
    super();
    this.nodeType = NodeType.Texture;
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
        const imgSize = image.getSize();
        this.tex = DesignerNode.updateTexture(
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

    this.addStringProperty("path", "Path");

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
