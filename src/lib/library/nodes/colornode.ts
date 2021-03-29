import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
import { Color } from "@/lib/designer/color";
import { ApplicationSettings } from "@/settings";

//const turqouise = new Color(48.0 / 255.0, 213.0 / 255.0, 200.0 / 255.0, 1.0);

export class ColorizeNode extends ImageDesignerNode {
  init() {
    this.title = "Colorize";

    this.addInput("image");

    const colorFocused = ApplicationSettings.getInstance().colorFocused;
    this.addColorProperty("color", "Color", Color.parse(colorFocused));

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

    const colorFocused = ApplicationSettings.getInstance().colorFocused;
    this.addColorProperty("color", "Color", Color.parse(colorFocused));

    let source = `
        vec4 process(vec2 uv)
        {
            return prop_color;
        }
        `;

    this.buildShader(source);
  }
}
