// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { NodeType } from "@/lib/designer/designernode";
import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
import { UpdateTexture } from "@/lib/utils";
import { buildShaderProgram } from "@/lib/designer/gl";
import { Property, AssetProperty } from "@/lib/designer/properties";
import { Color } from "@/lib/designer/color";
import {
  TextGeometry,
  TextAlign,
  TextAlignVertical,
} from "@/lib/geometry/textGeometry";
import { AssetManager, AssetType } from "@/assets/assetmanager";

const placeholderText = "Lorem ipsum Dolor sit amet.";
const placeholderSize = 72;
const placeholderLetterSpacing = 0;
const placeholderLineHeight = 1.175;

export class TextNode extends ImageDesignerNode {
  textGeom: TextGeometry;
  textFbo: WebGLFramebuffer;
  textProgram: WebGLShader;

  selectedFontId: string;
  fonts: Array<any>;
  color: Color;
  fontProp: AssetProperty;

  constructor() {
    super();
    this.nodeType = NodeType.Text;
    this.fonts = new Array();
    this.color = new Color(1.0, 1.0, 1.0);

    // Font
    let fontAssetList = AssetManager.getInstance().fontIds;

    if (!this.selectedFontId) {
      this.selectedFontId = fontAssetList[0];
    }

    this.textGeom = new TextGeometry(
      placeholderText,
      this.selectedFontId,
      placeholderSize,
      false,
      false,
      1,
      placeholderLetterSpacing,
      placeholderLineHeight,
      TextAlign.Left,
      TextAlignVertical.Center
    );

    this.textGeom.onFontChanged = () => {
      this.updateGeom();
    };

    this.onnodepropertychanged = (prop: Property) => {
      let value = this.evaluatePropertyValue(prop);

      if (prop.name === "font") {
        const asset = AssetManager.getInstance().getAssetById(
          value,
          AssetType.Font
        );

        const selectingId = asset
          ? asset.id
          : AssetManager.getInstance().getSystemFontPathById(value);

        if (this.selectedFontId != selectingId) {
          this.selectedFontId = selectingId;
          this.textGeom.requestSetupFont(this.selectedFontId);
        }
      } else if (prop.name === "text" && value != this.textGeom.text) {
        this.textGeom.updateText(value);
        this.updateGeom();
      } else if (prop.name === "size" && value != this.textGeom.size) {
        this.textGeom.updateSize(value);
        this.updateGeom();
      } else if (
        prop.name === "letterSpacing" &&
        value != this.textGeom.letterSpacing
      ) {
        this.textGeom.updateLetterSpacing(value);
        this.updateGeom();
      } else if (
        prop.name === "lineHeight" &&
        value != this.textGeom.lineHeignt
      ) {
        this.textGeom.updateLineHeight(value);
        this.updateGeom();
      } else if (prop.name === "align" && value != this.textGeom.align) {
        this.textGeom.updateAlign(value);
        this.updateGeom();
      } else if (
        prop.name === "alignVertical" &&
        value != this.textGeom.alignVertical
      ) {
        this.textGeom.updateAlignVertical(value);
        this.updateGeom();
      } else if (prop.name === "color" && this.color != value) {
        this.color = value;
        this.drawFont();
      }
    };

    this.onPropertyLoaded = async () => {
      this.textGeom.updateAlign(<TextAlign>this.getProperty("align"));
      this.textGeom.updateAlignVertical(
        <TextAlignVertical>this.getProperty("alignVertical")
      );
      this.textGeom.updateText(this.getProperty("text"));
      this.textGeom.updateSize(this.getProperty("size"));
      this.textGeom.updateLetterSpacing(this.getProperty("letterSpacing"));
      this.textGeom.updateLineHeight(this.getProperty("lineHeight"));
      this.color = this.getProperty("color");

      // if font property is using font of different locale
      const isForeignFont =
        this.fontProp.values.findIndex((item) => this.fontProp.value == item) !=
        -1;

      if (isForeignFont) {
        await AssetManager.getInstance().findForeignFont(this.fontProp.value);
      }

      if (this.selectedFontId != this.fontProp.getValue()) {
        this.selectedFontId = this.fontProp.value;
        this.textGeom.requestSetupFont(this.selectedFontId);
      }

      this.updateGeom();
    };
  }

  updateGeom() {
    this.resize(this.getWidth(), this.getHeight());
    this.createTexture();
    this.createFontGeom();
  }

  drawFont() {
    if (!this.textGeom || !this.textGeom.vertices || !this.textGeom.indices) {
      return;
    }

    const gl = this.gl;

    // bind a text framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.textFbo);
    gl.activeTexture(gl.TEXTURE0);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.baseTex,
      0
    );

    const color = this.color;

    // skip parent's render routine since render here is quite differnt from original one.
    const width = this.getWidth();
    const height = this.getHeight();

    gl.viewport(0, 0, width, height);

    this.designer.setTextureSize(width, height);

    const [uScale, uOffset, uColor] = [
      "uScale",
      "uOffset",
      "uColor",
    ].map((name) => gl.getUniformLocation(this.textProgram, name));
    gl.useProgram(this.textProgram);
    gl.uniform2fv(uScale, [2.0 / width, 2.0 / height]);

    gl.uniform2fv(uOffset, [-1.0, 1.0]);
    gl.uniform4fv(uColor, [color.r, color.g, color.b, color.a]);

    gl.clearColor(color.r, color.g, color.b, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.textGeom.vertices, gl.STATIC_DRAW);
    const indxBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indxBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      this.textGeom.indicesData,
      gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, true, 8, 0);

    gl.disable(gl.CULL_FACE);
    gl.drawElements(
      gl.TRIANGLES,
      this.textGeom.indices.length,
      gl.UNSIGNED_INT,
      0
    );

    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  createTexture() {
    const gl = this.gl;

    this.isTextureReady = false;

    if (this.tex) {
      gl.deleteTexture(this.tex);
      this.tex = null;
    }

    if (this.baseTex) {
      gl.deleteTexture(this.baseTex);
      this.baseTex = null;
    }

    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const nodetype = this.nodeType;
    let data = null;

    const width = this.getWidth();
    const height = this.getHeight();
    this.tex = UpdateTexture(
      level,
      internalFormat,
      width,
      height,
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
      width,
      height,
      border,
      format,
      type,
      data,
      NodeType.Texture,
      this.gl
    );

    this.isTextureReady = true;
  }

  createFontGeom() {
    this.textGeom.makeFontGeometry();
    this.drawFont();
    this.requestUpdate();
  }

  init() {
    // defer node initialization until texture is ready
    this.title = "Text";

    // Font
    this.fontProp = this.addAssetProperty("font", "Font", AssetType.Font);

    // color
    this.addColorProperty("color", "Color", this.color);

    // text
    this.addStringProperty("text", "Text", placeholderText);

    // align
    this.addEnumProperty("align", "Align", ["Left", "Center", "Right"]);

    // align vertical
    this.addEnumProperty(
      "alignVertical",
      "AlignVertical",
      ["Top", "Center", "Bottom"],
      1
    );

    // size
    this.addBoolProperty("fitToFrame", "Fit to frame", false);
    this.addIntProperty("size", "Size", placeholderSize, 5, 256, 1);

    // character interval
    this.addFloatProperty(
      "letterSpacing",
      "Letter spacing",
      0.0,
      0.0,
      1.0,
      0.01
    );

    // line interval
    this.addFloatProperty("lineHeight", "Line height", 1.175, 0.5, 3, 0.001);
    this.addIntProperty("frameWidth", "Frame Width", 1024, 128, 1024, 128);

    let vertSource = `
    precision mediump float;
    uniform vec2 uScale;
    uniform vec2 uOffset;
    attribute vec2 position;
    void main() {
      vec2 pos = position;
      gl_Position = vec4(pos * uScale + uOffset, 0.0, 1.0);
    }`;

    let fragSource = `
    precision mediump float;
    uniform vec4 uColor;
    void main() {
      gl_FragColor = uColor;
    }`;

    const gl = this.gl;
    this.textProgram = buildShaderProgram(gl, vertSource, fragSource);
    this.textFbo = gl.createFramebuffer();

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
    this.createTexture();
  }
}
