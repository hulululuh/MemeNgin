import { DesignerNode } from "../../designer/designernode";
import { Color } from "@/lib/designer/color";

export class TextureNode extends DesignerNode {
  public init() {
    this.title = "Texture";

    this.addInput("inputImage");

    var source = `
        vec4 process(vec2 uv)
        {
            return vec4(1.0, 1.0, 0.0, 1.0);
        }
        `;

    this.buildShader(source);
  }
}
