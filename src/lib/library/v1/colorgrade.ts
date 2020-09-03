import { DesignerNode, NodeType } from "../../designer/designernode";
//import { parseCubeLUT } from "parse-cube-lut";
//import { fs } from "fs";
var parseCubeLUT = require("parse-cube-lut");
import * as fs from "fs";
import { Property, FileProperty } from "@/lib/designer/properties";
const NativeImage = require("electron").nativeImage;

export class ColorGradeNode extends DesignerNode {
  //protected img: Electron.NativeImage;

  constructor() {
    super();
    this.nodeType = NodeType.Texture;
    //this.nodeType = NodeType.Procedural;

    this.onnodepropertychanged = (prop: Property) => {
      if (prop.name === "file") {
        this.texPath = (prop as FileProperty).value;
        this.createLut();
      }
    };
  }

  // call createLut instead
  public createTexture() {}

  public createLut() {
    if (this.texPath) {
      const buf = fs.readFileSync(this.texPath);
      const lut = parseCubeLUT(buf);

      // if we receive odd number power of 2 e.g) 2^5 = 32, then the size of Lut data should be 2^15
      // We take this as the square of 2^8 texture, having half blank data since WebGL has its own limitations handling 3d texture and NPOT texture as well.
      const dimAsPOT = Math.log2(lut.size);
      const isOdd = dimAsPOT % 2;
      const pow = Math.floor((dimAsPOT * 3 + 1) / 2);
      const layoutSize = Math.pow(2, pow);
      const numLutPixels = layoutSize * layoutSize;
      lut.size;
      lut.data;

      console.log(lut);

      let gl = this.gl;

      if (this.tex) {
        gl.deleteTexture(this.tex);
        this.tex = null;
      }

      const level = 0;
      const internalFormat = gl.RGB;
      const border = 0;
      const format = gl.RGB;
      const type = gl.UNSIGNED_BYTE;
      const nodetype = this.nodeType;
      let data = new Uint8Array(numLutPixels * 3);

      // TODO: find a better(cheaper) way to do this
      for (let i = 0; i < lut.data.length; i++) {
        const pos = i * 3;
        data[pos + 0] = lut.data[i][0] * 255;
        data[pos + 1] = lut.data[i][1] * 255;
        data[pos + 2] = lut.data[i][2] * 255;
      }

      this.baseTex = DesignerNode.updateTexture(
        level,
        internalFormat,
        layoutSize,
        layoutSize,
        border,
        format,
        type,
        data,
        nodetype,
        this.gl
      );

      this.isTextureReady = true;
      this.requestUpdate();
    }
  }

  public init() {
    this.title = "Color Grade";
    let fileProp = this.addFileProperty("file", "path", "", ["cube"]);

    // this happens when we drop image file into canvas
    if (this.texPath !== "") {
      fileProp.setValue(this.texPath);
      this.createLut();
    }

    this.addInput("image");
    this.addFloatProperty("contrast", "Contrast", 0.0, -1, 1, 0.1);
    this.addFloatProperty("brightness", "Brightness", 0.0, -1, 1, 0.1);

    let source = `

        vec3 lookup(vec3 col, sampler2D lut) {
          return vec3(texture(lut, col.rg));
        }

        vec4 process(vec2 uv)
        {
            vec4 col = texture(image, uv);

            if (baseTexture_ready) {
              //col = vec4(lookup(col.rgb, baseTexture), col.a);
              col = texture(baseTexture, uv);
            }

            col = vec4(uv, 0.0, 1.0);

            return col;
        }
        `;

    this.buildShader(source);
  }
}
