import * as THREE from "three";

import { DesignerNode, NodeType } from "../../designer/designernode";
import { remote, app } from "electron";
import path from "path";
import { fdatasync, promises } from "fs";
import { ResolvedKeybinding } from "custom-electron-titlebar/lib/common/keyCodes";
const loadFont = require("load-bmfont");
const createLayout = require("layout-bmfont-text");

// "three-bmfont-text" demands globalThis.THREE, if there is better way to handle this.
globalThis.THREE = require("three");
const createGeometry = require("three-bmfont-text");

function fetchFont(
  fntPath: string,
  texPath: string,
  text: string,
  renderer: THREE.WebGLRenderer
) {
  return new Promise(function(resolve, reject) {
    loadFont(fntPath, function(err, font) {
      if (err) {
        reject();
      }

      // create a geometry of packed bitmap glyphs,
      // word wrapped to 300px and right-aligned
      var geometry = createGeometry({
        width: 300,
        align: "right",
        font: font,
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
          color: 0xaaffff,
          // transparent: false,
          // color: 0xff0000,
        });

        // now do something with our mesh!
        let mesh = new THREE.Mesh(geometry, material);
        let rttScene = new THREE.Scene();
        const width = 1024;
        const height = 1024;
        let renderTarget = new THREE.WebGLRenderTarget(width, height);
        renderTarget.texture.minFilter = THREE.LinearFilter;

        let rttCamera = new THREE.OrthographicCamera(
          width / -2,
          width / 2,
          height / 2,
          height / -2,
          -10000,
          10000
        );
        rttCamera.position.z = 100;

        rttScene.add(mesh);

        mesh.rotation.y = 180;

        // mesh.position.x = -150;
        // mesh.scale.z *= -1.0;

        let geom = new THREE.BoxGeometry(100, 100, 100);
        let boxMat = new THREE.MeshBasicMaterial({ color: 0xff00000 });
        let cube = new THREE.Mesh(geom, boxMat);
        // cube.position.z = -5;
        // cube.rotation.x = 10;
        // cube.rotation.y = 5;
        //cube.position.x = new THREE.Vector3(0, 0, 0);
        //rttScene.add(cube);

        renderer.setRenderTarget(renderTarget);
        renderer.setClearColor(new THREE.Color(1.0, 1.0, 1.0));
        //renderer.setClearColor(new THREE.Color(0.7, 0.7, 0.7));
        renderer.clear();
        renderer.render(rttScene, rttCamera);

        const texProps = renderer.properties.get(renderTarget.texture);
        resolve(texProps.__webglTexture);
      });
    });
  });
}

async function Load(
  fntPath: string,
  texPath: string,
  text: string,
  renderer: THREE.WebGLRenderer,
  instance: TextNode
) {
  try {
    const fontTex = await fetchFont(fntPath, texPath, text, renderer);

    let gl = instance.gl;
    // clear existing texture if any
    if (instance.tex) {
      gl.deleteTexture(instance.tex);
      instance.tex = null;
    }

    if (fontTex) {
      instance.tex = fontTex;
      instance.isTextureReady = true;
      instance.requestUpdateThumbnail();
    }
  } catch (err) {
    console.log("font creation failed", err);
  }
}

export class TextNode extends DesignerNode {
  constructor() {
    super();
    this.nodeType = NodeType.Text;
  }

  public createTexture() {
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

    Load(
      fntPath,
      texPath,
      "Lorem ipsum\nDolor sit amet.",
      this.designer.renderer,
      this
    ).then((fontTex) => {
      console.debug(fontTex);
    });
  }

  public init() {
    // defer node initialization until texture is ready
    if (!this.hasBaseTexture() || !this.isTextureReady) return;

    this.title = "Text";

    this.addStringProperty("text", "Text");

    // size

    // tansform
    this.addFloatProperty("translateX", "Translate X", 0, -1.0, 1.0, 0.01);
    this.addFloatProperty("translateY", "Translate Y", 0, -1.0, 1.0, 0.01);

    this.addFloatProperty("scaleX", "Scale X", 1, -2.0, 2.0, 0.01);
    this.addFloatProperty("scaleY", "Scale Y", 1, -2.0, 2.0, 0.01);

    this.addFloatProperty("rot", "Rotation", 0, 0.0, 360.0, 0.01);

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

  public onTextureReady() {
    this.init();
  }
}
