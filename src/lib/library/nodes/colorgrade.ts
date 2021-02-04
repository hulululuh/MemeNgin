import { NodeType, NodeCategory } from "../../designer/designernode";
import {
  ImageDesignerNode,
  TexPrecision,
  UpdateTexture,
} from "@/lib/designer/imagedesignernode";

let parseCubeLUT = require("parse-cube-lut");
import * as fs from "fs";
import { Property, FileProperty } from "@/lib/designer/properties";

export class ColorGradeNode extends ImageDesignerNode {
  constructor() {
    super();
    this.nodeType = NodeType.Texture;
    this.nodeCategory = NodeCategory.Color;

    this.onnodepropertychanged = (prop: Property) => {
      if (prop.name === "file") {
        this.texPath = (prop as FileProperty).value;

        this.resize(this.getWidth(), this.getHeight());
        this.createLut();
        this.requestUpdate();
      }
    };
  }

  getBaseTextureType(): number {
    return this.gl.TEXTURE_3D;
  }

  getTexturePrecision(): TexPrecision {
    return TexPrecision.lowp;
  }

  // call createLut instead
  createTexture() {
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
    const nodetype = NodeType.Procedural;
    let data = null;
    this.tex = UpdateTexture(
      level,
      internalFormat,
      this.getWidth(),
      this.getHeight(),
      border,
      format,
      type,
      data,
      nodetype,
      this.gl
    );
  }

  createLut() {
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

      console.log(lut);

      // create fbo texture
      //this.createTexture();

      let gl = this.gl;

      const level = 0;
      const internalFormat = gl.RGB;
      const border = 0;
      const format = gl.RGB;
      const type = gl.UNSIGNED_BYTE;
      const nodetype = this.nodeType;

      this.baseTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_3D, this.baseTex);

      let lutData = new Uint8Array(lut.size * lut.size * lut.size * 3).fill(
        255
      );

      for (let i = 0; i < lut.data.length; i++) {
        const pos = i * 3;
        lutData[pos + 0] = lut.data[i][0] * 255;
        lutData[pos + 1] = lut.data[i][1] * 255;
        lutData[pos + 2] = lut.data[i][2] * 255;
      }

      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

      gl.texImage3D(
        gl.TEXTURE_3D,
        level,
        internalFormat,
        lut.size,
        lut.size,
        lut.size,
        border,
        format,
        type,
        lutData
      );

      // set the filtering so we don't need mips
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

      gl.bindTexture(gl.TEXTURE_3D, null);

      this.isTextureReady = true;
    }
  }

  init() {
    this.title = "Color Grade";
    let fileProp = this.addFileProperty("file", "path", "", ["cube"]);

    // this happens when we drop image file into canvas
    if (this.texPath !== "") {
      fileProp.setValue(this.texPath);

      this.resize(this.getWidth(), this.getHeight());
      this.createLut();
      this.requestUpdate();
    }

    this.addInput("image");

    let source = `
        vec4 process(vec2 uv)
        {
          vec4 col = vec4(1.0, 1.0, 0.0, 1.0);

          if (baseTexture_ready) {
            if (image_connected) {
              col = texture(image, uv);
              col = vec4(texture(baseTexture, col.rgb).rgb, col.a);
            }
            else {
              col = vec4(texture(baseTexture, vec3(uv, (uv.x + uv.y)/2.0)).rgb, 1.0);
            }
          }

          return col;
        }
        `;

    this.buildShader(source);
  }
}
