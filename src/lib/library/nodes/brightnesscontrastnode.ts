// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

// https://github.com/evanw/glfx.js/blob/master/src/filters/adjust/brightnesscontrast.js
export class BrightnessContrastNode extends ImageDesignerNode {
  init() {
    this.title = "Brightness Contrast";

    this.addInput("image");

    this.addFloatProperty("contrast", "Contrast", 0.0, -1, 1, 0.1);
    this.addFloatProperty("brightness", "Brightness", 0.0, -1, 1, 0.1);
    let source = `
        vec4 process(vec2 uv)
        {
            vec4 col = texture(image, uv);

            col.rgb += prop_brightness;
            if (prop_contrast > 0.0)
                col.rgb = (col.rgb - 0.5) / (1.0 - prop_contrast) + 0.5;
            else
                col.rgb = (col.rgb - 0.5) * (1.0 + prop_contrast) + 0.5;

            return col;
        }
        `;

    this.buildShader(source);
  }
}
