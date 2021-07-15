// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
import { Color } from "@/lib/designer/color";

const colorFocused = Color.parse("#0095ffff");

export class ColorizeNode extends ImageDesignerNode {
  init() {
    this.title = "Colorize";
    this.addInput("image");
    this.addColorProperty("color", "Color", colorFocused);

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
    this.addColorProperty("color", "Color", colorFocused);

    let source = `
        vec4 process(vec2 uv)
        {
            return prop_color;
        }
        `;

    this.buildShader(source);
  }
}
