// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class MapRangeNode extends ImageDesignerNode {
  init() {
    this.title = "Map Range";

    this.addInput("image");
    this.addFloatProperty("in_min", "Input Minimum", 0, 0, 1.0, 0.01);
    this.addFloatProperty("in_max", "Input Maximum", 1, 0, 1.0, 0.01);
    this.addFloatProperty("out_min", "Output Minimum", 0, 0, 1.0, 0.01);
    this.addFloatProperty("out_max", "Output Maximum", 1, 0, 1.0, 0.01);

    let source = `
        vec4 process(vec2 uv)
        {
            vec4 col = texture(image,uv);

            // color range coming in
            float inDiff = prop_in_max - prop_in_min;
            col = (col-prop_in_min) / inDiff;

            float outDiff = prop_out_max - prop_out_min;
            col.rgb = prop_out_min + col.rgb * vec3(outDiff);
            return col;
        }
        `;

    this.buildShader(source);
  }
}
