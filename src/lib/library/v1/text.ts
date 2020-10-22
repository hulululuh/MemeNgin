import * as THREE from "three";
import * as loadFont from "load-bmfont";

import { DesignerNode, NodeType } from "../../designer/designernode";
import { remote, app } from "electron";
import path from "path";
// import { fdatasync, promises } from "fs";
// import { ResolvedKeybinding } from "custom-electron-titlebar/lib/common/keyCodes";
import { Designer } from "@/lib/designer";
import {
  Property,
  StringProperty,
  ColorProperty,
} from "@/lib/designer/properties";
import { Color } from "@/lib/designer/color";
//const loadFont = require("load-bmfont");

// "three-bmfont-text" demands globalThis.THREE, if there is better way to handle this.
globalThis.THREE = require("three");
//import { createGeometry } from "three-bmfont-text";
const createGeometry = require("three-bmfont-text");

function fetchFont(
  fntPath: string,
  texPath: string,
  text: string,
  designer: Designer
) {
  return new Promise(function(resolve, reject) {
    loadFont(fntPath, function(err, font) {
      if (err) {
        reject();
      }

      const rttRenderer = designer.rttRenderer;
      const rttScene = designer.rttScene;
      const rttCamera = designer.rttCamera;

      // create a geometry of packed bitmap glyphs,
      // word wrapped to 300px and right-aligned
      let geometry = createGeometry({
        width: 512,
        align: "center",
        font: font,
        //letterSpacing: 12,
      });

      // change text and other options as desired
      // the options sepcified in constructor will
      // be used as defaults
      geometry.update(text);

      // the resulting layout has metrics and bounds
      console.log(geometry.layout.height);
      console.log(geometry.layout.descender);

      // the texture atlas containing our glyphs
      let textureLoader = new THREE.TextureLoader();
      textureLoader.load(texPath, function(texture) {
        // we can use a simple ThreeJS material
        let material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          color: 0xffffff,
          opacity: 1.0,
          depthTest: false,
          depthWrite: false,
          // transparent: false,
          // color: 0xff0000,
        });

        // clear  ttScene
        while (rttScene.children.length > 0) {
          rttScene.remove(rttScene.children[0]);
        }

        // now do something with our mesh!
        let mesh = new THREE.Mesh(geometry, material);
        const width = 1024;
        const height = 1024;
        let renderTarget = new THREE.WebGLRenderTarget(width, height);
        renderTarget.texture.minFilter = THREE.LinearFilter;

        //mesh.position.x = 0.01;
        //mesh.position.y = 0.01;
        // mesh.rotation.y = 180;
        // mesh.rotation.z = 180;

        //const lookthis = mesh.position.add(new THREE.Vector3(0, 0, -100));
        //mesh.lookAt(lookthis);
        mesh.up.set(0, -1, 0);
        mesh.lookAt(0, 0, -100);
        //mesh.rotation.z = 180;

        mesh.position.x = -256;
        mesh.position.y = -128;

        //mesh.applyQuaternion(new THREE.Quaternion(0, 1, 1, 1));
        rttScene.add(mesh);

        let geom = new THREE.BoxGeometry(1, 1, 1);
        let boxMat = new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.0,
          depthWrite: false,
          depthTest: false,
        });
        let cube = new THREE.Mesh(geom, boxMat);
        rttScene.add(cube);

        rttRenderer.setRenderTarget(renderTarget);
        //rttRenderer.setClearColor(new THREE.Color(1.0, 1.0, 1.0), 0.0);
        //rttRenderer.setClearColor(new THREE.Color(0.0, 1.0, 0.0), 0.0);

        //rttRenderer.setClearColor(new THREE.Color(0.0, 0.0, 0.0), 0.0);
        //rttRenderer.clear(true, true, false);
        rttRenderer.render(rttScene, rttCamera);

        const texProps = rttRenderer.properties.get(renderTarget.texture);
        resolve(texProps.__webglTexture);
      });
    });
  });
}

async function Load(
  fntPath: string,
  texPath: string,
  text: string,
  designer: Designer,
  instance: TextNode
) {
  try {
    const fontTex = await fetchFont(fntPath, texPath, text, designer);

    let gl = instance.gl;
    // clear existing texture if any
    if (instance.baseTex) {
      gl.deleteTexture(instance.baseTex);
      instance.baseTex = null;
    }

    if (fontTex) {
      instance.baseTex = fontTex;
      instance.isTextureReady = true;
      instance.requestUpdate();
      //instance.requestUpdateThumbnail();
    }
  } catch (err) {
    console.log("font creation failed", err);
  }
}

export class TextNode extends DesignerNode {
  constructor() {
    super();
    this.nodeType = NodeType.Text;

    this.onnodepropertychanged = (prop: Property) => {
      if (prop.name === "text") {
        this.createTexture();
      } else if (prop.name === "color") {
        let col = (prop as ColorProperty).value;
      }
      // else if (propName === "size") {
      //   //this.createTexture();
      // }
    };
  }

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
      NodeType.Procedural,
      this.gl
    );

    let prop = this.properties.find((x) => {
      return x.name == "text";
    });

    const fontPath = path.join(
      remote.app.getAppPath() + "/../src/assets/fonts/Noto_Sans/"
    );
    const fntPath = path.join(fontPath, "NotoSans-Regular.fnt");
    const texPath = path.join(fontPath, "NotoSans-Regular_atlas.png");

    // const fontPath = path.join(
    //   remote.app.getAppPath() + "/../src/assets/fonts/aladin/"
    // );
    // const fntPath = path.join(fontPath, "Aladin-Regular.json");
    // const texPath = path.join(fontPath, "Aladin-Regular.png");

    // let prop = this.properties.find((x) => {
    //   return x.name == "text";
    // });

    if (prop) {
      const text = (prop as StringProperty).value;

      Load(fntPath, texPath, text, this.designer, this).then((fontTex) => {
        console.debug(fontTex);
      });
    }
  }

  init() {
    // defer node initialization until texture is ready

    this.title = "Text";

    // color
    this.addColorProperty("color", "Color", new Color(1.0, 1.0, 1.0));

    // text
    this.addStringProperty("text", "Text", "Lorem ipsum\nDolor sit amet.");

    // size
    this.addIntProperty("size", "Size", 30, 5, 100, 1);

    // tansform
    this.addFloatProperty("translateX", "Translate X", 0, -1.0, 1.0, 0.01);
    this.addFloatProperty("translateY", "Translate Y", 0, -1.0, 1.0, 0.01);

    this.addFloatProperty("scaleX", "Scale X", 1, -2.0, 2.0, 0.01);
    this.addFloatProperty("scaleY", "Scale Y", 1, -2.0, 2.0, 0.01);

    this.addFloatProperty("rot", "Rotation", 0, 0.0, 360.0, 0.01);

    let source = `
        mat2 buildScale(float sx, float sy)
        {
            return mat2(sx, 0.0, 0.0, sy);
        }

        // rot is in degrees
        mat2 buildRot(float rot)
        {
            float r = radians(rot);
            return mat2(cos(r), -sin(r), sin(r), cos(r));
        }
        
        mat3 transMat(vec2 t)
        {
            return mat3(vec3(1.0,0.0,0.0), vec3(0.0,1.0,0.0), vec3(t, 1.0));
        }

        mat3 scaleMat(vec2 s)
        {
            return mat3(vec3(s.x,0.0,0.0), vec3(0.0,s.y,0.0), vec3(0.0, 0.0, 1.0));
        }

        mat3 rotMat(float rot)
        {
            float r = radians(rot);
            return mat3(vec3(cos(r), -sin(r),0.0), vec3(sin(r), cos(r),0.0), vec3(0.0, 0.0, 1.0));
        }

        float median(float r, float g, float b)
        {
          return max(min(r, g), min(max(r, g), b));
        }

        vec4 process(vec2 uv)
        {
          mat3 trans = transMat(vec2(0.5, 0.5)) *
          transMat(vec2(prop_translateX, prop_translateY)) *
          rotMat(prop_rot) *
          scaleMat(vec2(prop_scaleX, prop_scaleY)) *
          transMat(vec2(-0.5, -0.5));

          vec3 res = inverse(trans) * vec3(uv, 1.0);
          uv = res.xy;

          vec4 col = vec4(0,1,0,1);
          if (baseTexture_ready) {
            vec3 flipped_texCoords = vec3(uv.x, 1.0 - uv.y, 0.5);
            vec2 pos = flipped_texCoords.xy;
            vec3 distance = texture(baseTexture, uv).rgb;
            ivec2 sz = textureSize(baseTexture, 0).xy;
            float dx = dFdx(pos.x) * float(sz.x); 
            float dy = dFdy(pos.y) * float(sz.y);
            float sigDist = median(distance.r, distance.g, distance.b);
            float w = fwidth(sigDist);
            float opacity = smoothstep(0.5 - w, 0.5 + w, sigDist);
            col = vec4(prop_color.rgb, opacity);
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
