import { DesignerNode } from "../../designer/designernode";
import { Color } from "@/lib/designer/color";

export class TextureNode extends DesignerNode {
  public init() {
    this.title = "Texture";

    var source = `
        vec4 process(vec2 uv)
        {
          vec4 col = vec4(0,1,0,1);
          if (baseTexture_ready) {
            col = texture(baseTexture, uv);
            //col = vec4(1,0,1,1);
          } else {
            col = vec4(uv.x, uv.y, 0.0, 1.0);
          }
          return col;
        }
        `;

    this.buildShader(source);
  }
}
