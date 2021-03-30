import { DesignerNode, NodeType, NodeInput } from "@/lib/designer/designernode";
import { Designer } from "@/lib/designer";
import { buildShaderProgram } from "@/lib/designer/gl";
import {
  FloatProperty,
  IntProperty,
  BoolProperty,
  EnumProperty,
  ColorProperty,
  GradientProperty,
  Transform2DProperty,
} from "@/lib/designer/properties";
import { Editor } from "@/lib/editor";
import { Matrix4 } from "@math.gl/core";

export enum TexPrecision {
  lowp,
  midiump,
  highp,
}

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

export function UpdateTexture<T>(
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

export class ImageDesignerNode extends DesignerNode {
  tex: WebGLTexture;
  baseTex: WebGLTexture;
  isTextureReady: boolean;

  isInput: boolean;
  isOutput: boolean;
  inheritParentSize: boolean;

  width: number;
  height: number;

  //program:WebGLShader;
  source: string; // shader code
  shaderProgram: WebGLProgram;

  // tells scene to update the texture next frame
  isEditing: boolean = false;
  isAsyncWorkPending: boolean = false;

  constructor() {
    super();

    this.isTextureReady = false;
    this.isInput = false;
    this.isOutput = false;
    this.width = 1024;
    this.height = 1024;
    this.parentIndex = "image";
    this.inheritParentSize = true;
  }

  _init() {
    this.createTexture();
    this.init();
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

  getBaseTexture(): WebGLTexture {
    return this.tex ? this.tex : Designer.dummyTex;
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

  createTextureAsync?: () => Promise<DesignerNode>;

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

  connected(leftNode: DesignerNode, rightIndex: string) {
    if (this.isParentIndex(rightIndex) && this.inheritParentSize) {
      // fit the size to parent node - try resize
      if (leftNode instanceof ImageDesignerNode) {
        this.resizeByNode(leftNode);
      }
    }

    if (this.createTextureAsync) {
      this.createTextureAsync().then((n) => {
        n.requestUpdate();
      });
    } else {
      this.createTexture();

      // update node here, if the createTexture() is sync, otherwise(async) handle it from outside
      this.requestUpdate();
    }

    if (this.onConnected) {
      this.onConnected(leftNode, rightIndex);
    }
  }

  resizeByNode(node: DesignerNode): boolean {
    let imgNode = node as ImageDesignerNode;

    if (imgNode) {
      const w = imgNode.getWidth();
      const h = imgNode.getHeight();
      return this.resize(w, h);
    } else {
      return false;
    }
  }

  resize(width: number, height: number): boolean {
    const sizeChanged = this.width !== width || this.height !== height;
    if (!sizeChanged) return false;

    this.width = width;
    this.height = height;

    if (this.onResized) {
      this.onResized();
    }

    // find a corresponding NodeGraphicsItem
    const gNodes = Editor.getInstance().nodeScene.nodes.find(
      (x) => x.id === this.id
    );
    if (gNodes) {
      // make output node double sized
      gNodes.setVirtualSize(width, height);
    }

    // if the result node size has changed, we should resize 2d canvas also
    if (this.isOutput) {
      let event = new CustomEvent("resizeImage", {
        detail: {
          width: this.getWidth(),
          height: this.getHeight(),
        },
      });

      if (document) document.dispatchEvent(event);
    }

    return true;
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

      if (!(input.node instanceof ImageDesignerNode)) continue;

      let node = input.node as ImageDesignerNode;
      const tex = node.getBaseTexture();
      const texW = node.tex ? node.getWidth() : 100;
      const texH = node.tex ? node.getHeight() : 100;

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
      let value = this.evaluatePropertyValue(prop);

      if (prop instanceof FloatProperty) {
        gl.uniform1f(
          gl.getUniformLocation(this.shaderProgram, "prop_" + prop.name),
          value
        );
      }
      if (prop instanceof IntProperty) {
        gl.uniform1i(
          gl.getUniformLocation(this.shaderProgram, "prop_" + prop.name),
          value
        );
      }
      if (prop instanceof BoolProperty) {
        gl.uniform1i(
          gl.getUniformLocation(this.shaderProgram, "prop_" + prop.name),
          value == false ? 0 : 1
        );
      }
      if (prop instanceof EnumProperty) {
        gl.uniform1i(
          gl.getUniformLocation(this.shaderProgram, "prop_" + prop.name),
          (prop as EnumProperty).index
        );
      }
      if (prop instanceof ColorProperty) {
        gl.uniform4f(
          gl.getUniformLocation(this.shaderProgram, "prop_" + prop.name),
          value.r,
          value.g,
          value.b,
          value.a
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

            vec4 col = process(v_texCoord);
            vec4 colBG = backgroundCol(v_texCoord);

            // alpha
            fragColor = col;
        }

        `;

    fragSource =
      fragSource +
      this.createRandomLib() +
      this.createGradientLib() +
      this.createColorLib() +
      this.createCodeForInputs() +
      this.createCodeForProps() +
      "#line 0\n" +
      source;

    this.shaderProgram = buildShaderProgram(this.gl, vertSource, fragSource);
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

  createColorLib() {
    let code: string = `
      const float EPSILON = 1e-10;
      const float LIGHT_SCALE = 0.3921568;
      
      const mat3 LIN_2_LMS_MAT = mat3(
          vec3(3.90405e-1, 5.49941e-1, 8.92632e-3),
          vec3(7.08416e-2, 9.63172e-1, 1.35775e-3),
          vec3(2.31082e-2, 1.28021e-1, 9.36245e-1));

      const mat3 LMS_2_LIN_MAT = mat3(
        vec3(2.85847e+0, -1.62879e+0, -2.48910e-2),
        vec3(-2.10182e-1,  1.15820e+0,  3.24281e-4),
        vec3(-4.18120e-2, -1.18169e-1,  1.06867e+0));

      const float wb = 5.336778471840789E-03;
      const float wc = 6.664243592410049E-01;
      const float wd = 3.023761372137289E+00;
      const float we = -6.994413182098681E+00;
      const float wf = 3.293987131616894E+00;
      const float wb2 = -1.881032803339283E-01;
      const float wc2 = 2.812945435181010E+00;
      const float wd2 = -1.495096839176419E+01;
      const float we2 = 3.349416467551858E+01;
      const float wf2 = -3.433024909629221E+01;
      const float wg2 = 1.314308200442166E+01;

      const float bb = 8.376727344831676E-01;
      const float bc = -3.418495999327269E+00;
      const float bd = 8.078054837335609E+00;
      const float be = -1.209938703324099E+01;
      const float bf = 9.520315785756406E+00;
      const float bg = -2.919340722745241E+00;
      const float ba2 = 5.088652898054800E-01;
      const float bb2 = -9.767371127415029E+00;
      const float bc2 = 4.910705739925203E+01;
      const float bd2 = -1.212150899746360E+02;
      const float be2 = 1.606205314047741E+02;
      const float bf2 = -1.085660871669277E+02;
      const float bg2 = 2.931582214601388E+01;

      float Lum(vec3 c){
        return 0.299*c.r + 0.587*c.g + 0.114*c.b;
      }
      
      vec3 ClipColor(vec3 c){
        float l = Lum(c);
        float n = min(min(c.r, c.g), c.b);
        float x = max(max(c.r, c.g), c.b);
      
        if (n < 0.0) c = max((c-l)*l / (l-n) + l, 0.0);
        if (x > 1.0) c = min((c-l) * (1.0-l) / (x-l) + l, 1.0);
      
        return c;
      }
      
      vec3 SetLum(vec3 c, float l){
        c += l - Lum(c);
      
        return ClipColor(c);
      }
      
      float Sat(vec3 c){
        float n = min(min(c.r, c.g), c.b);
        float x = max(max(c.r, c.g), c.b);
      
        return x - n;
      }
      
      vec3 SetSat(vec3 c, float s){
        float cmin = min(min(c.r, c.g), c.b);
        float cmax = max(max(c.r, c.g), c.b);
      
        vec3 res = vec3(0.0);
      
        if (cmax > cmin) {
      
          if (c.r == cmin && c.b == cmax) { // R min G mid B max
            res.r = 0.0;
            res.g = ((c.g-cmin)*s) / (cmax-cmin);
            res.b = s;
          }
          else if (c.r == cmin && c.g == cmax) { // R min B mid G max
            res.r = 0.0;
            res.b = ((c.b-cmin)*s) / (cmax-cmin);
            res.g = s;
          }
          else if (c.g == cmin && c.b == cmax) { // G min R mid B max
            res.g = 0.0;
            res.r = ((c.r-cmin)*s) / (cmax-cmin);
            res.b = s;
          }
          else if (c.g == cmin && c.r == cmax) { // G min B mid R max
            res.g = 0.0;
            res.b = ((c.b-cmin)*s) / (cmax-cmin);
            res.r = s;
          }
          else if (c.b == cmin && c.r == cmax) { // B min G mid R max
            res.b = 0.0;
            res.g = ((c.g-cmin)*s) / (cmax-cmin);
            res.r = s;
          }
          else { // B min R mid G max
            res.b = 0.0;
            res.r = ((c.r-cmin)*s) / (cmax-cmin);
            res.g = s;
          }
      
        }
      
        return res;
      }
      
      int modi(int x, int y) {
        return x - y * (x / y);
      }
      
      int and(int a, int b) {
          int result = 0;
          int n = 1;
        const int BIT_COUNT = 32;
      
          for(int i = 0; i < BIT_COUNT; i++) {
              if ((modi(a, 2) == 1) && (modi(b, 2) == 1)) {
                  result += n;
              }
      
              a >>= 1;
              b >>= 1;
              n <<= 1;
      
              if (!(a > 0 && b > 0))
                  break;
          }
          return result;
      }

      vec3 colorTemperatureToRGB(const in float temperature){
        mat3 m = (temperature <= 6500.0) ? mat3(vec3(0.0, -2902.1955373783176, -8257.7997278925690),
                                              vec3(0.0, 1669.5803561666639, 2575.2827530017594),
                                              vec3(1.0, 1.3302673723350029, 1.8993753891711275)) : 
                        mat3(vec3(1745.0425298314172, 1216.6168361476490, -8257.7997278925690),
                                                vec3(-2666.3474220535695, -2173.1012343082230, 2575.2827530017594),
                                              vec3(0.55995389139931482, 0.70381203140554553, 1.8993753891711275)); 
        return mix(clamp(vec3(m[0] / (vec3(clamp(temperature, 1000.0, 40000.0)) + m[1]) + m[2]), vec3(0.0), vec3(1.0)), vec3(1.0), smoothstep(1000.0, 0.0, temperature));
      }

      vec3 hsv2rgb( in vec3 c )
      {
          vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );

        return c.z * mix( vec3(1.0), rgb, c.y);
      }

      vec3 hsv2rgb_smooth( in vec3 c )
      {
          vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );

        rgb = rgb*rgb*(3.0-2.0*rgb); // cubic smoothing	

        return c.z * mix( vec3(1.0), rgb, c.y);
      }

      vec3 HUEtoRGB(in float hue)
      {
          vec3 rgb = abs(hue * 6. - vec3(3, 2, 4)) * vec3(1, -1, -1) + vec3(-1, 2, 2);
          return clamp(rgb, 0., 1.);
      }
      
      vec3 RGBtoHCV(in vec3 rgb)
      {
          vec4 p = (rgb.g < rgb.b) ? vec4(rgb.bg, -1., 2. / 3.) : vec4(rgb.gb, 0., -1. / 3.);
          vec4 q = (rgb.r < p.x) ? vec4(p.xyw, rgb.r) : vec4(rgb.r, p.yzx);
          float c = q.x - min(q.w, q.y);
          float h = abs((q.w - q.y) / (6. * c + EPSILON) + q.z);
          return vec3(h, c, q.x);
      }
      
      vec3 HSVtoRGB(in vec3 hsv)
      {
          vec3 rgb = HUEtoRGB(hsv.x);
          return ((rgb - 1.) * hsv.y + 1.) * hsv.z;
      }
      
      vec3 HSLtoRGB(in vec3 hsl)
      {
          vec3 rgb = HUEtoRGB(hsl.x);
          float c = (1. - abs(2. * hsl.z - 1.)) * hsl.y;
          return (rgb - 0.5) * c + hsl.z;
      }
      
      vec3 RGBtoHSV(in vec3 rgb)
      {
          vec3 hcv = RGBtoHCV(rgb);
          float s = hcv.y / (hcv.z + EPSILON);
          return vec3(hcv.x, s, hcv.z);
      }
      
      vec3 RGBtoHSL(in vec3 rgb)
      {
          vec3 hcv = RGBtoHCV(rgb);
          float z = hcv.z - hcv.y * 0.5;
          float s = hcv.y / (1. - abs(z * 2. - 1.) + EPSILON);
          return vec3(hcv.x, s, z);
      }

      vec3 SRGBtoRGB(vec3 srgb) {
          return pow(srgb, vec3(2.1632601288));
      }

      vec3 RGBtoSRGB(vec3 rgb) {
          return pow(rgb, vec3(0.46226525728));
      }
      
      bool UVtoCheck(vec2 uv) {
        int cU = int(uv.x+10000.0);
        int cV = int(uv.y+10000.0);
        int shift = 0;
        if (cU<0) shift++;
        if (cV<0) shift++;
        return (cU+cV)%2 == 0;
    }

      vec3 WhiteBalance(vec3 In, float Temperature, float Tint)
      {
        float t1 = Temperature * 10.0 / 6.0;
        float t2 = Tint * 10.0 / 6.0;

        // Get the CIE xy chromaticity of the reference white point.
        float x = 0.31271 - t1 * (t1 < 0.0 ? 0.1 : 0.05);
        float standardIlluminantY = 2.87 * x - 3.0 * x * x - 0.27509507;
        float y = standardIlluminantY + t2 * 0.05;

        // Calculate the coefficients in the LMS space.
        vec3 w1 = vec3(0.949237, 1.03542, 1.08728); // D65 white point

        // CIExyToLMS
        float Y = 1.0;
        float X = Y * x / y;
        float Z = Y * (1.0 - x - y) / y;
        float L = 0.7328 * X + 0.4296 * Y - 0.1624 * Z;
        float M = -0.7036 * X + 1.6975 * Y + 0.0061 * Z;
        float S = 0.0030 * X + 0.0136 * Y + 0.9834 * Z;
        vec3 w2 = vec3(L, M, S);

        vec3 balance = vec3(w1.x / w2.x, w1.y / w2.y, w1.z / w2.z);

        vec3 lms = LIN_2_LMS_MAT * In;
        lms *= balance;
        vec3 outColor = LMS_2_LIN_MAT * lms;
        return outColor;
      }

      vec4 vibrance(vec4 inCol, float vibrance) //r,g,b 0.0 to 1.0,  vibrance 1.0 no change, 0.0 image B&W.
      {
        vec4 outCol;
          if (vibrance <= 1.0)
          {
              float avg = dot(inCol.rgb, vec3(0.3, 0.6, 0.1));
              outCol.rgb = mix(vec3(avg), inCol.rgb, vibrance); 
          }
          else // vibrance > 1.0
          {
              float hue_a, a, f, p1, p2, p3, i, h, s, v, amt, _max, _min, dlt;
              float br1, br2, br3, br4, br5, br2_or_br1, br3_or_br1, br4_or_br1, br5_or_br1;
              int use;

              _min = min(min(inCol.r, inCol.g), inCol.b);
              _max = max(max(inCol.r, inCol.g), inCol.b);
              dlt = _max - _min + 0.00001 /*Hack to fix divide zero infinities*/;
              h = 0.0;
              v = _max;

          br1 = step(_max, 0.0);
              s = (dlt / _max) * (1.0 - br1);
              h = -1.0 * br1;

          br2 = 1.0 - step(_max - inCol.r, 0.0); 
              br2_or_br1 = max(br2, br1);
              h = ((inCol.g - inCol.b) / dlt) * (1.0 - br2_or_br1) + (h*br2_or_br1);

          br3 = 1.0 - step(_max - inCol.g, 0.0); 
              
              br3_or_br1 = max(br3, br1);
              h = (2.0 + (inCol.b - inCol.r) / dlt) * (1.0 - br3_or_br1) + (h*br3_or_br1);

              br4 = 1.0 - br2*br3;
              br4_or_br1 = max(br4, br1);
              h = (4.0 + (inCol.r - inCol.g) / dlt) * (1.0 - br4_or_br1) + (h*br4_or_br1);

              h = h*(1.0 - br1);

              hue_a = abs(h); // between h of -1 and 1 are skin tones
              a = dlt;      // Reducing enhancements on small rgb differences

              // Reduce the enhancements on skin tones.    
              a = step(1.0, hue_a) * a * (hue_a * 0.67 + 0.33) + step(hue_a, 1.0) * a;                                    
              a *= (vibrance - 1.0);
              s = (1.0 - a) * s + a * pow(s, 0.25);

              i = floor(h);
              f = h - i;

              p1 = v * (1.0 - s);
              p2 = v * (1.0 - (s * f));
              p3 = v * (1.0 - (s * (1.0 - f)));

              inCol.rgb = vec3(0.0); 
              i += 6.0;
              //use = 1 << ((int)i % 6);
              use = int(pow(2.0,mod(i,6.0)));
              a = float(and(use , 1)); // i == 0;
              use >>= 1;
              inCol.rgb += a * vec3(v, p3, p1);
      
              a = float(and(use , 1)); // i == 1;
              use >>= 1;
              inCol.rgb += a * vec3(p2, v, p1); 

              a = float( and(use,1)); // i == 2;
              use >>= 1;
              inCol.rgb += a * vec3(p1, v, p3);

              a = float(and(use, 1)); // i == 3;
              use >>= 1;
              inCol.rgb += a * vec3(p1, p2, v);

              a = float(and(use, 1)); // i == 4;
              use >>= 1;
              inCol.rgb += a * vec3(p3, p1, v);

              a = float(and(use, 1)); // i == 5;
              use >>= 1;
              inCol.rgb += a * vec3(v, p1, p2);

              outCol = inCol;
          }
          return outCol;
      }

      vec3 black_white(vec3 base, float blacks, float whites)
      {
        float maxx = max(base.r, max(base.g, base.b));
        float minx = min(base.r, min(base.g, base.b));
        float lum = (maxx+minx)/2.0;
        float x = lum;
        float x2 = x*x;
        float x3 = x2*x;
        float lum_pos, lum_neg;
        vec3 res;
      
        // whites
        lum_pos = wb*x + wc*x2+ wd*x3 + we*x2*x2 + wf*x2*x3;
        lum_pos = min(lum_pos,1.0-lum);
        lum_neg = wb2*x + wc2*x2+ wd2*x3 + we2*x2*x2 + wf2*x2*x3 + wg2*x3*x3;
        lum_neg = max(lum_neg,-lum);
        res = whites>=0.0 ? base*(lum_pos*whites+lum)/lum : base * (lum-lum_neg*whites)/lum;
        res = clamp(res, 0.0, 1.0);
      
        // blacks
        lum_pos = bb*x + bc*x2+ bd*x3 + be*x2*x2 + bf*x2*x3 + bg*x3*x3;
        lum_pos = min(lum_pos,1.0-lum);
        lum_neg = lum<=0.23 ? -lum : ba2 + bb2*x + bc2*x2+ bd2*x3 + be2*x2*x2 + bf2*x2*x3 + bg2*x3*x3;
        lum_neg = max(lum_neg,-lum);
        res = blacks>=0.0 ? res*(lum_pos*blacks+lum)/lum : res * (lum-lum_neg*blacks)/lum;
        res = clamp(res, 0.0, 1.0);

        return SetLum(base, Lum(res));
      }

      vec3 shadow_highlight(vec3 base, float shadows, float highlights)
      {
        float amt = mix(highlights, shadows, 1.0 - Lum(base));
      
        if (amt < 0.0) amt *= 2.0;
      
        // exposure
        vec3 res = mix(base, vec3(1.0), amt);
        vec3 blend = mix(vec3(1.0), pow(base, vec3(1.0/0.7)), amt);
        res = max(1.0 - ((1.0 - res) / blend), 0.0);
        res = SetLum(SetSat(base, Sat(res)), Lum(res));
      
        return clamp(res, 0.0, 1.0);
      }

      // policy: (0)Repeat, (1)Stretch, (2)Clamp
      const float margin = 1.0/2048.0;
      float overlayOpacity(sampler2D tex, vec2 uv, int policy) {
        bool isBorder = false;
        if (policy == 1 || policy == 0) {
          uv = clamp(uv, 0.0, 1.0);

          if (uv.x > (1.0 - margin) || uv.x < margin || uv.y > (1.0 - margin) || uv.y < margin) {
            isBorder = true;
          }
        }

        float weight = texture(tex, uv).a;
        if (weight > 1.0 - margin) {
          // if image seems not have a alpha check r channel
          weight = texture(tex, uv).r;
        }
        if (isBorder && policy == 0) { // Clamp
          weight = 0.0f;
        }

        return weight;
      }

      vec4 overlayColor(sampler2D tex, vec2 uv, int policy) {
        bool isBorder = false;
        if (policy == 1 || policy == 0) {
          uv = clamp(uv, 0.0, 1.0);

          if (uv.x > (1.0 - margin) || uv.x < margin || uv.y > (1.0 - margin) || uv.y < margin) {
            isBorder = true;
          }
        }

        vec4 texCol = texture(tex, uv);
        float weight = texCol.a;
        if (isBorder && policy == 0) { // Clamp
          weight = 0.0f;
        }
        texCol.a = weight;

        return texCol;
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

  setAsInput() {
    this.isInput = true;
  }

  setAsOutput() {
    this.isOutput = true;
  }
}
