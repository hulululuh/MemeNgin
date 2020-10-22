import { DesignerNode } from "../../designer/designernode";
import { Color } from "@/lib/designer/color";

export class ColorizeNode extends DesignerNode {
  init() {
    this.title = "Colorize";

    this.addInput("image");

    this.addColorProperty("color", "Color", new Color());

    let source = `
        vec4 process(vec2 uv)
        {
          vec4 texel = texture(image,uv);
          return vec4(texel.rgb * prop_color.rgb, texel.a);
        }
        `;

    this.buildShader(source);
  }
}

export class ColorNode extends DesignerNode {
  init() {
    this.title = "Color";

    this.addColorProperty("color", "Color", new Color());

    let source = `
        vec4 process(vec2 uv)
        {
            return prop_color;
        }
        `;

    this.buildShader(source);
  }
}
