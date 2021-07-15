// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class HeightShiftNode extends ImageDesignerNode {
  init() {
    this.title = "Height Shift";

    this.addInput("image");

    this.addFloatProperty("shift", "Shift", 0.0, -1.0, 1.0, 0.01);

    let source = `
        vec4 process(vec2 uv)
        {
            vec4 a =  texture(image, uv);

            return a + vec4(vec3(prop_shift), 0.0);
        }
        `;

    this.buildShader(source);
  }
}
