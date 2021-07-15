// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class ThresholdNode extends ImageDesignerNode {
  init() {
    this.title = "Threshold";

    this.addInput("image");

    this.addFloatProperty("threshold", "Threshold", 0.0, 0.0, 1.0, 0.01);
    this.addBoolProperty("invert", "Invert", true);

    let source = `
        vec4 process(vec2 uv)
        {
            vec4 a =  texture(image, uv);

            if (prop_invert)
                a.rgb = step(1.0 - prop_threshold, a.rgb);
            else
                a.rgb = step(prop_threshold, a.rgb);

            return a;
        }
        `;

    this.buildShader(source);
  }
}
