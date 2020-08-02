import * as THREE from "three";

import { DesignerNode, NodeType } from "../../designer/designernode";
import { remote } from "electron";
import path from "path";
const loadFont = require("load-bmfont");

// "three-bmfont-text" demands globalThis.THREE, if there is better way to handle this.
globalThis.THREE = require("three");
const createGeometry = require("three-bmfont-text");

let Load = (fntPath: string, texPath: string, text: string) => {
  loadFont(fntPath, function(err, font) {
    if (err) {
      throw err;
    }

    // create a geometry of packed bitmap glyphs,
    // word wrapped to 300px and right-aligned
    let geometry = createGeometry({
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
    var textureLoader = new THREE.TextureLoader();
    textureLoader.load(texPath, function(texture) {
      // we can use a simple ThreeJS material
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        color: 0xaaffff,
      });

      // now do something with our mesh!
      var mesh = new THREE.Mesh(geometry, material);

      return texture;
    });
  });
};

export class TextNode extends DesignerNode {
  constructor() {
    super();
    this.nodeType = NodeType.Text;
  }

  public createTexture() {}

  public init() {
    this.title = "Text";

    this.addStringProperty("text", "Text");

    const fontPath = path.join(
      remote.app.getAppPath() + "/../src/assets/fonts/Noto_Sans/"
    );
    const fntPath = path.join(fontPath, "NotoSans-Regular.fnt");
    const texPath = path.join(fontPath, "NotoSans-Regular_atlas.png");

    let tex = Load(fntPath, texPath, "Lorem ipsum\nDolor sit amet.");

    // size

    // tansform
    this.addFloatProperty("translateX", "Translate X", 0, -1.0, 1.0, 0.01);
    this.addFloatProperty("translateY", "Translate Y", 0, -1.0, 1.0, 0.01);

    this.addFloatProperty("scaleX", "Scale X", 1, -2.0, 2.0, 0.01);
    this.addFloatProperty("scaleY", "Scale Y", 1, -2.0, 2.0, 0.01);

    this.addFloatProperty("rot", "Rotation", 0, 0.0, 360.0, 0.01);

    var source = `
        vec4 process(vec2 uv)
        {
            return vec4(1.0, 0.0, 0.0, 1.0);
        }
        `;

    this.buildShader(source);
  }
}
