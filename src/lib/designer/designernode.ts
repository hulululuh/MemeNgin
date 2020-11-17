import { Guid } from "../utils";
import { Designer } from "../designer";
import {
  Property,
  FloatProperty,
  IntProperty,
  BoolProperty,
  EnumProperty,
  ColorProperty,
  StringProperty,
  FileProperty,
  GradientProperty,
  IPropertyHolder,
  Transform2DProperty,
} from "./properties";
import { buildShaderProgram } from "./gl";
import { Color } from "./color";
import { Gradient } from "./gradient";
import { Editor } from "../editor";
import { Vector2, Matrix4 } from "@math.gl/core";
import { WidgetEvent } from "@/lib/scene/graphicsitem";
import { Transform2D } from "../math/transform2d";

const NativeImage = require("electron").nativeImage;

const POTs: number[] = [
  1,
  2,
  4,
  8,
  16,
  32,
  64,
  128,
  256,
  512,
  1024,
  2048,
  4096,
];

export enum TexPrecision {
  lowp,
  midiump,
  highp,
}

new Map([
  ["1", ["test"]],
  ["2", ["test2"]],
]);

// TypeScript
const PrecisionName = new Map<TexPrecision, string>([
  [TexPrecision.lowp, "lowp"],
  [TexPrecision.midiump, "midiump"],
  [TexPrecision.highp, "highp"],
]);

export class NodeInput {
  node: DesignerNode;
  name: string;
}

export enum NodeType {
  Procedural,
  Texture,
  Text,
  Logic,
}

export class DesignerNode implements IPropertyHolder {
  id: string = Guid.newGuid();
  title: string;
  typeName: string; // added when node is created from library
  texPath: string;
  nodeType: NodeType;

  gl: WebGL2RenderingContext;
  designer: Designer;
  tex: WebGLTexture;
  baseTex: WebGLTexture;
  isTextureReady: boolean;

  isInput: boolean;
  isResult: boolean;

  width: number;
  height: number;

  // this indicates which node should we use, when it needs to be resized
  parentIndex: string;

  //program:WebGLShader;
  source: string; // shader code
  shaderProgram: WebGLProgram;
  exportName: string;

  inputs: string[] = new Array();
  properties: Property[] = new Array();

  // tells scene to update the texture next frame
  needsUpdate: boolean = true;

  isEditing: boolean = false;

  onWidgetDragged?: (evt: WidgetEvent) => void;
  onItemSelected(): void {
    const event = new WidgetEvent("widgetUpdate", {
      detail: {
        enable: false,
      },
    });

    document.dispatchEvent(event);
  }

  // constructor
  constructor() {
    this.nodeType = NodeType.Procedural;
    this.isTextureReady = false;
    this.isInput = false;
    this.isResult = false;
    this.width = 1024;
    this.height = 1024;
    this.parentIndex = "image";
  }

  isParentIndex(name: string): boolean {
    // if the node has one input then it is a prime index
    if (this.inputs.length < 2) {
      return true;
    } else {
      return name === this.parentIndex;
    }
  }

  getParentNode(): any {
    return Editor.getDesigner().findLeftNode(this.id, this.parentIndex);
  }

  getCenter(): Vector2 {
    const scene = Editor.getScene();
    const result = scene.nodes.filter((item) => item.id === this.id)[0];

    if (result) {
      const pos = result.getPos();
      return new Vector2(
        pos.x + result.getWidth() / 2,
        pos.y + result.getHeight() / 2
      );
    } else {
      return new Vector2(0, 0);
    }
  }

  getWidth(): number {
    if (this.width) {
      return this.width;
    } else {
      return this.designer.width;
    }
  }

  getHeight(): number {
    if (this.height) {
      return this.height;
    } else {
      return this.designer.height;
    }
  }

  getBaseTextureType(): number {
    return this.gl.TEXTURE_2D;
  }

  getTexturePrecision(): TexPrecision {
    return TexPrecision.highp;
  }

  hasBaseTexture(): boolean {
    return (
      this.nodeType === NodeType.Text || this.nodeType === NodeType.Texture
    );
  }

  readyToUpdate() {
    if (this.hasBaseTexture()) {
      return this.isTextureReady;
    } else {
      return true;
    }
  }

  // callbacks
  onthumbnailgenerated: (DesignerNode, HTMLImageElement) => void;
  onnodepropertychanged?: (prop: Property) => void;
  ondisconnected?: (node: DesignerNode, name: string) => void;

  // an update is requested when:
  // a property is changed
  // a new connection is made
  // a connection is removed
  //
  // all output connected nodes are invalidated as well
  requestUpdate() {
    this.designer.requestUpdate(this);
  }

  requestUpdateThumbnail() {
    this.designer.requestUpdateThumbnail(this);
  }

  resize(width: number, height: number) {
    const sizeChanged = this.width !== width || this.height !== height;

    if (sizeChanged) {
      this.width = width;
      this.height = height;

      // if the result node size has changed, we should resize 2d canvas also
      if (this.isResult) {
        let event = new CustomEvent("resizeImage", {
          detail: {
            width: this.getWidth(),
            height: this.getHeight(),
          },
        });

        document?.dispatchEvent(event);
      }

      // find a corresponding NodeGraphicsItem
      const gNodes = Editor.getInstance().nodeScene.nodes.find(
        (x) => x.id === this.id
      );
      if (gNodes) {
        gNodes.setVirtualSize(width, height);
      }
      //this.createTexture();
    }
    //this.requestUpdate();
  }

  render(inputs: NodeInput[], optional?: Function) {
    let gl = this.gl;

    // bind texture to fbo
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // bind shader
    gl.useProgram(this.shaderProgram);

    let texIndex = 0;
    // clear all inputs
    for (const input of this.inputs) {
      gl.activeTexture(gl.TEXTURE0 + texIndex);
      gl.bindTexture(gl.TEXTURE_2D, null);

      gl.uniform1i(gl.getUniformLocation(this.shaderProgram, input), 0);

      gl.uniform1i(
        gl.getUniformLocation(this.shaderProgram, input + "_connected"),
        0
      );
    }

    this.designer.setTextureSize(this.getWidth(), this.getHeight());

    texIndex = 0;
    // pass inputs for rendering
    //for (const input of inputs) {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const tex = input.node.tex ? input.node.tex : Designer.dummyTex;
      const texW = input.node.tex ? input.node.getWidth() : 100;
      const texH = input.node.tex ? input.node.getHeight() : 100;

      gl.activeTexture(gl.TEXTURE0 + texIndex);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(
        gl.getUniformLocation(this.shaderProgram, input.name),
        texIndex
      );
      gl.uniform1i(
        gl.getUniformLocation(this.shaderProgram, input.name + "_connected"),
        1
      );
      gl.uniform2f(
        gl.getUniformLocation(this.shaderProgram, input.name + "_size"),
        texW,
        texH
      );

      input.name;
      console.log("bound texture " + texIndex);
      texIndex++;
    }

    // pass baseTexture if it is texture node
    if (this.hasBaseTexture()) {
      const tex = this.isTextureReady ? this.baseTex : Designer.dummyTex;
      const textureType = this.isTextureReady
        ? this.getBaseTextureType()
        : gl.TEXTURE_2D;
      gl.activeTexture(gl.TEXTURE0 + texIndex);
      gl.bindTexture(textureType, tex);
      gl.uniform1i(
        gl.getUniformLocation(this.shaderProgram, "baseTexture"),
        texIndex
      );
      gl.uniform1i(
        gl.getUniformLocation(this.shaderProgram, "baseTexture_ready"),
        1
      );

      console.log("bound texture " + texIndex);
      texIndex++;
    }

    const texW = this.getWidth();
    const texH = this.getHeight();

    const modelMat = new Matrix4().scale([texW, texH, 1.0]);
    const viewMat = new Matrix4().lookAt([0, 0, 1], [0, 0, 0], [0, 1, 0]);
    const projMat = new Matrix4().ortho({
      left: -texW / 2,
      right: texW / 2,
      bottom: -texH / 2,
      top: texH / 2,
      near: -100,
      far: 100,
    });

    const mvpMat = new Matrix4(modelMat)
      .multiplyRight(viewMat)
      .multiplyRight(projMat);

    gl.uniformMatrix4fv(
      gl.getUniformLocation(this.shaderProgram, "baseTexMVP"),
      false,
      mvpMat.toFloat32Array()
    );

    // pass seed
    gl.uniform1f(
      gl.getUniformLocation(this.shaderProgram, "_seed"),
      this.designer.getRandomSeed()
    );

    // texture size
    gl.uniform2f(
      gl.getUniformLocation(this.shaderProgram, "_textureSize"),
      this.getWidth(),
      this.getHeight()
    );

    // optioanl parameter setup from child class
    if (optional) {
      optional();
    }

    // pass properties
    for (let prop of this.properties) {
      if (prop instanceof FloatProperty) {
        gl.uniform1f(
          gl.getUniformLocation(this.shaderProgram, "prop_" + prop.name),
          (prop as FloatProperty).value
        );
      }
      if (prop instanceof IntProperty) {
        gl.uniform1i(
          gl.getUniformLocation(this.shaderProgram, "prop_" + prop.name),
          (prop as IntProperty).value
        );
      }
      if (prop instanceof BoolProperty) {
        gl.uniform1i(
          gl.getUniformLocation(this.shaderProgram, "prop_" + prop.name),
          (prop as BoolProperty).value == false ? 0 : 1
        );
      }
      if (prop instanceof EnumProperty) {
        gl.uniform1i(
          gl.getUniformLocation(this.shaderProgram, "prop_" + prop.name),
          (prop as EnumProperty).index
        );
      }
      if (prop instanceof ColorProperty) {
        let col = (prop as ColorProperty).value;
        //console.log("color: ", col);
        gl.uniform4f(
          gl.getUniformLocation(this.shaderProgram, "prop_" + prop.name),
          col.r,
          col.g,
          col.b,
          col.a
        );
      }
      if (prop instanceof GradientProperty) {
        let gradient = (prop as GradientProperty).value;

        gl.uniform1i(
          gl.getUniformLocation(
            this.shaderProgram,
            "prop_" + prop.name + ".numPoints"
          ),
          gradient.points.length
        );

        for (let i = 0; i < gradient.points.length; i++) {
          let point = gradient.points[i];
          let col = point.color;

          gl.uniform3f(
            gl.getUniformLocation(
              this.shaderProgram,
              "prop_" + prop.name + ".colors[" + i + "]"
            ),
            col.r,
            col.g,
            col.b
          );

          gl.uniform1f(
            gl.getUniformLocation(
              this.shaderProgram,
              "prop_" + prop.name + ".positions[" + i + "]"
            ),
            point.t
          );
        }
      }

      if (prop instanceof Transform2DProperty) {
        let mat2d = (prop as Transform2DProperty).value
          .toMatrix()
          .toFloat32Array();

        gl.uniformMatrix3fv(
          gl.getUniformLocation(this.shaderProgram, "prop_" + prop.name),
          false,
          mat2d
        );
      }
    }

    // bind mesh
    let posLoc = gl.getAttribLocation(this.shaderProgram, "a_pos");
    let texCoordLoc = gl.getAttribLocation(this.shaderProgram, "a_texCoord");

    // provide texture coordinates for the rectangle.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.designer.posBuffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.designer.texCoordBuffer);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.disableVertexAttribArray(posLoc);
    gl.disableVertexAttribArray(texCoordLoc);

    // render
  }

  getInputs(): string[] {
    return this.inputs;
  }

  protected addInput(name: string) {
    this.inputs.push(name);
  }

  setProperty(name: string, value: any) {
    let prop = this.properties.find((x) => {
      return x.name == name;
    });

    if (prop) {
      prop.setValue(value);
      this.requestUpdate();
    }

    // for (let prop of this.properties) {
    //   console.log("prop iter");
    //   console.log(prop);
    //   console.log(prop.name == name);
    //   if (prop.name == name) {
    //     prop.setValue(value);
    //     this.requestUpdate();
    //   }
    // }
  }

  _init() {
    //this.inputs = new Array();
    //this.properties = new Array();
    this.createTexture();

    this.init();
  }

  protected init() {
    /*
        this.source = `
        vec4 process(vec2 uv)
        {
        return vec4(uv,x, uv.y, 0, 0);
        }
        `;

        this.buildShader(this.source);
        */
  }

  setAsInput() {
    this.isInput = true;
  }

  setAsResult() {
    this.isResult = true;
  }

  // #source gets appended to fragment shader
  buildShader(source: string) {
    let vertSource: string = `#version 300 es
        precision highp float;
        uniform mat4 baseTexMVP;

        in vec3 a_pos;
        in vec2 a_texCoord;
            
        // the texCoords passed in from the vertex shader.
        out vec2 v_texCoord;
            
        void main() {
            gl_Position = vec4(a_pos, 1.0) * baseTexMVP;
            v_texCoord = a_texCoord;
            
            //gl_Position = vec4(a_pos * 2.0, 1.0);
            //v_texCoord = (gl_Position.xy + 1.0) / 2.0;
        }`;

    let fragSource: string = `#version 300 es
        precision highp float;
        in vec2 v_texCoord;

        #define GRADIENT_MAX_POINTS 32

        vec4 process(vec2 uv);
        void initRandom();

        uniform vec2 _textureSize;

        out vec4 fragColor;

        vec4 backgroundCol(vec2 uv) {
          //_textureSize;
          float r = _textureSize.y/_textureSize.x;

          vec2 aa = vec2(1.0, r);

          vec2 mult = uv * aa * 20.0;
          int a = int(mult.x) % 2;
          int b = int(mult.y) % 2;
          bool darker = ((a+b) % 2) == 0;

          if(darker)
            return vec4(vec3(4.0/8.0), 1.0);
          else
            return vec4(vec3(7.0/8.0), 1.0);
        }
            
        void main() {
            initRandom();
            //fragColor = process(v_texCoord);

            vec4 col = process(v_texCoord);
            vec4 colBG = backgroundCol(v_texCoord);
            
            //fragColor = mix(colBG, col, col.a);
            //fragColor.a = col.a;

            // // alpha
            fragColor = col;
        }

        `;

    fragSource =
      fragSource +
      this.createRandomLib() +
      this.createGradientLib() +
      this.createCodeForInputs() +
      this.createCodeForProps() +
      "#line 0\n" +
      source;

    this.shaderProgram = buildShaderProgram(this.gl, vertSource, fragSource);
  }

  static updateTexture<T>(
    level: number,
    internalFormat: number,
    width: number,
    height: number,
    border: number,
    format: number,
    type: number,
    pixels: ArrayBufferView,
    nodetype: NodeType,
    gl: WebGL2RenderingContext,
    souldConvertChannel: boolean = false,
    shouldFlip: boolean = false
  ): WebGLTexture {
    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // bind a dummy texture to suppress WebGL warning.
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([255, 0, 255, 255])
    ); // red

    if (shouldFlip) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    } else {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    }

    if (souldConvertChannel) {
      // TODO: this should be fixed by using proper glAPI for texture format
      for (let i = 0; i < width * height; i++) {
        let pixelIdx = i * 4;
        [pixels[pixelIdx], pixels[pixelIdx + 2]] = [
          pixels[pixelIdx + 2],
          pixels[pixelIdx],
        ];
      }
    }

    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      format,
      type,
      pixels
    );

    const isPot = width === height && POTs.find((element) => element === width);
    if (isPot) {
      // set the filtering so we don't need mips
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    } else {
      // NPOT textures
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    gl.bindTexture(gl.TEXTURE_2D, null);

    return tex;
  }

  static getNearestPOT(num: number): number {
    const pow = Math.floor(Math.log2(num));
    return Math.pow(2, pow);
  }

  // creates opengl texture for this node
  // gets the height from the scene
  // if the texture is already created, delete it and recreate it
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
    const nodetype = this.nodeType;
    let data = null;
    this.tex = DesignerNode.updateTexture(
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

  connected(leftNode: DesignerNode, rightIndex: string) {
    if (this.isParentIndex(rightIndex)) {
      // fit the size to parent node - try resize
      this.resize(leftNode.width, leftNode.height);
    }
    this.createTexture();
    this.requestUpdate();
  }

  createRandomLibOld(): string {
    // float _seed = `+this.designer.getRandomSeed().toFixed(1)+`;
    let code: string = `
        // this offsets the random start (should be a uniform)
        uniform float _seed;
        // this is the starting number for the rng
        // (should be set from the uv coordinates so it's unique per pixel)
        vec2 _randomStart;

        float _rand(vec2 co){
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        //todo: test variance!
        vec2 _rand2(vec2 co){
            return vec2(_rand(co), _rand(co + vec2(0.0001, 0.0001)));
        }

        float randomFloat(int index) 
        {
            return _rand(_randomStart + vec2(_seed) + vec2(index));
        }

        float randomVec2(int index) 
        {
            return _rand(_randomStart + vec2(_seed) + vec2(index));
        }

        float randomFloat(int index, float start, float end)
        {
            float r = _rand(_randomStart + vec2(_seed) + vec2(index));
            return start + r*(end-start);
        }

        int randomInt(int index, int start, int end)
        {
            float r = _rand(_randomStart + vec2(_seed) + vec2(index));
            return start + int(r*float(end-start));
        }

        bool randomBool(int index)
        {
            return _rand(_randomStart + vec2(_seed) + vec2(index)) > 0.5;
        }

        void initRandom()
        {
            _randomStart = v_texCoord;
        }
        `;

    return code;
  }

  createRandomLib(): string {
    // float _seed = `+this.designer.getRandomSeed().toFixed(1)+`;
    let code: string = `
        // this offsets the random start (should be a uniform)
        uniform float _seed;
        // this is the starting number for the rng
        // (should be set from the uv coordinates so it's unique per pixel)
        vec2 _randomStart;

        // gives a much better distribution at 1
        #define RANDOM_ITERATIONS 1

        #define HASHSCALE1 443.8975
        #define HASHSCALE3 vec3(443.897, 441.423, 437.195)
        #define HASHSCALE4 vec4(443.897, 441.423, 437.195, 444.129)

        //  1 out, 2 in...
        float hash12(vec2 p)
        {
            vec3 p3  = fract(vec3(p.xyx) * HASHSCALE1);
            p3 += dot(p3, p3.yzx + 19.19);
            return fract((p3.x + p3.y) * p3.z);
        }

        ///  2 out, 2 in...
        vec2 hash22(vec2 p)
        {
            vec3 p3 = fract(vec3(p.xyx) * HASHSCALE3);
            p3 += dot(p3, p3.yzx+19.19);
            return fract((p3.xx+p3.yz)*p3.zy);

        }


        float _rand(vec2 uv)
        {
            float a = 0.0;
            for (int t = 0; t < RANDOM_ITERATIONS; t++)
            {
                float v = float(t+1)*.152;
                // 0.005 is a good value
                vec2 pos = (uv * v);
                a += hash12(pos);
            }

            return a/float(RANDOM_ITERATIONS);
        }

        vec2 _rand2(vec2 uv)
        {
            vec2 a = vec2(0.0);
            for (int t = 0; t < RANDOM_ITERATIONS; t++)
            {
                float v = float(t+1)*.152;
                // 0.005 is a good value
                vec2 pos = (uv * v);
                a += hash22(pos);
            }

            return a/float(RANDOM_ITERATIONS);
        }

        float randomFloat(int index) 
        {
            return _rand(_randomStart + vec2(_seed) + vec2(index));
        }

        float randomVec2(int index) 
        {
            return _rand(_randomStart + vec2(_seed) + vec2(index));
        }

        float randomFloat(int index, float start, float end)
        {
            float r = _rand(_randomStart + vec2(_seed) + vec2(index));
            return start + r*(end-start);
        }

        int randomInt(int index, int start, int end)
        {
            float r = _rand(_randomStart + vec2(_seed) + vec2(index));
            return start + int(r*float(end-start));
        }

        bool randomBool(int index)
        {
            return _rand(_randomStart + vec2(_seed) + vec2(index)) > 0.5;
        }

        void initRandom()
        {
            _randomStart = v_texCoord;
        }
        `;

    return code;
  }

  createGradientLib(): string {
    // float _seed = `+this.designer.getRandomSeed().toFixed(1)+`;
    let code: string = `
    struct Gradient {
				vec3 colors[GRADIENT_MAX_POINTS];
				float positions[GRADIENT_MAX_POINTS];
				int numPoints;
    };
        
    // assumes points are sorted
    vec3 sampleGradient(vec3 colors[GRADIENT_MAX_POINTS], float positions[GRADIENT_MAX_POINTS], int numPoints, float t)
    {
        if (numPoints == 0)
            return vec3(1,0,0);
        
        if (numPoints == 1)
            return colors[0];
        
        // here at least two points are available
        if (t <= positions[0])
            return colors[0];
        
        int last = numPoints - 1;
        if (t >= positions[last])
            return colors[last];
        
        // find two points in-between and lerp
        
        for(int i = 0; i < numPoints-1;i++) {
            if (positions[i+1] > t) {
                vec3 colorA = colors[i];
                vec3 colorB = colors[i+1];
                
                float t1 = positions[i];
                float t2 = positions[i+1];
                
                float lerpPos = (t - t1)/(t2 - t1);
                return mix(colorA, colorB, lerpPos);
                
            }
            
        }
        
        return vec3(0,0,0);
    }

    vec3 sampleGradient(Gradient gradient, float t)
    {
      return sampleGradient(gradient.colors, gradient.positions, gradient.numPoints, t);
    }
    `;

    return code;
  }

  createCodeForInputs() {
    let code: string = "";

    for (let input of this.inputs) {
      code += "uniform sampler2D " + input + ";\n";
      code += "uniform bool " + input + "_connected;\n";
      code += "uniform vec2 " + input + "_size;\n";
    }

    if (this.hasBaseTexture()) {
      const textureType = this.getBaseTextureType();
      if (textureType === this.gl.TEXTURE_3D) {
        const precision = "lowp";
        code += "uniform " + precision + " sampler3D baseTexture;\n";
      } else if (textureType === this.gl.TEXTURE_2D) {
        code += "uniform sampler2D baseTexture;\n";
      }
      code += "uniform bool baseTexture_ready;\n";
    }

    // TODO: relocate it later
    //code += "uniform mat4 baseTexMVP;\n";

    return code;
  }

  createCodeForProps() {
    let code: string = "";

    //console.log(this.properties);
    //console.log(typeof FloatProperty);

    for (let prop of this.properties) {
      //code += "uniform sampler2D " + input + ";\n";
      if (prop instanceof FloatProperty) {
        code += "uniform float prop_" + prop.name + ";\n";
      }
      if (prop instanceof IntProperty) {
        code += "uniform int prop_" + prop.name + ";\n";
      }
      if (prop instanceof BoolProperty) {
        code += "uniform bool prop_" + prop.name + ";\n";
      }
      if (prop instanceof EnumProperty) {
        code += "uniform int prop_" + prop.name + ";\n";
      }
      if (prop instanceof ColorProperty) {
        code += "uniform vec4 prop_" + prop.name + ";\n";
      }
      if (prop instanceof GradientProperty) {
        // code += "uniform struct prop_" + prop.name + " {\n";
        // code += "vec3 colors[GRADIENT_MAX_POINTS];\n";
        // code += "vec3 positions[GRADIENT_MAX_POINTS];\n";
        // code += "int numPoints;\n";
        // code += "};";

        code += "uniform Gradient prop_" + prop.name + ";\n";
      }
      if (prop instanceof Transform2DProperty) {
        code += "uniform mat3 prop_" + prop.name + ";\n";
      }
    }

    code += "\n";

    return code;
  }

  // PROPERTY FUNCTIONS
  addIntProperty(
    id: string,
    displayName: string,
    defaultVal: number = 1,
    minVal: number = 1,
    maxVal: number = 100,
    increment: number = 1
  ): IntProperty {
    let prop = new IntProperty(id, displayName, defaultVal);
    prop.minValue = minVal;
    prop.maxValue = maxVal;
    prop.step = increment;

    this.properties.push(prop);
    return prop;
  }

  addFloatProperty(
    id: string,
    displayName: string,
    defaultVal: number = 1,
    minVal: number = 1,
    maxVal: number = 100,
    increment: number = 1
  ): FloatProperty {
    let prop = new FloatProperty(id, displayName, defaultVal);
    prop.minValue = minVal;
    prop.maxValue = maxVal;
    prop.step = increment;

    this.properties.push(prop);
    return prop;
  }

  addBoolProperty(
    id: string,
    displayName: string,
    defaultVal: boolean = false
  ): BoolProperty {
    let prop = new BoolProperty(id, displayName, defaultVal);

    this.properties.push(prop);
    return prop;
  }

  addEnumProperty(
    id: string,
    displayName: string,
    defaultVal: string[] = new Array()
  ): EnumProperty {
    let prop = new EnumProperty(id, displayName, defaultVal);

    this.properties.push(prop);
    return prop;
  }

  addColorProperty(
    id: string,
    displayName: string,
    defaultVal: Color
  ): ColorProperty {
    let prop = new ColorProperty(id, displayName, defaultVal);

    this.properties.push(prop);
    return prop;
  }

  addStringProperty(
    id: string,
    displayName: string,
    defaultVal: string = ""
  ): StringProperty {
    let prop = new StringProperty(id, displayName, defaultVal);

    this.properties.push(prop);
    return prop;
  }

  addFileProperty(
    id: string,
    displayName: string,
    defaultVal: string = "",
    extensions: string[] = ["*"]
  ): FileProperty {
    let prop = new FileProperty(id, displayName, defaultVal, extensions);

    this.properties.push(prop);
    return prop;
  }

  addGradientProperty(
    id: string,
    displayName: string,
    defaultVal: Gradient
  ): GradientProperty {
    let prop = new GradientProperty(id, displayName, defaultVal);

    this.properties.push(prop);
    return prop;
  }

  addTransform2DProperty(
    id: string,
    displayName: string,
    defaultVal: Transform2D
  ): Transform2DProperty {
    let prop = new Transform2DProperty(id, displayName, defaultVal);

    this.properties.push(prop);
    return prop;
  }
}
