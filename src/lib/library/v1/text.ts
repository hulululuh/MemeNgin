import { DesignerNode } from "../../designer/designernode";
import { createGeometry } from "three-bmfont-text";
import { loadFont } from "load-bmfont";

export class TextNode extends DesignerNode {
  public init() {
    this.title = "Text";

    this.addStringProperty("text", "Text");

    // font

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
