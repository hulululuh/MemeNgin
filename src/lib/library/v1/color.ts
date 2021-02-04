import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
import { Color } from "@/lib/designer/color";

export class ColorizeNode extends ImageDesignerNode {
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

export class ColorNode extends ImageDesignerNode {
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
