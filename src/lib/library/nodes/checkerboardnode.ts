// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
import { Color } from "@/lib/designer/color";

// https://stackoverflow.com/questions/4694608/glsl-checkerboard-pattern
export class CheckerBoardNode extends ImageDesignerNode {
  init() {
    this.title = "CheckerBoard";

    this.addIntProperty("rows", "Rows", 2, 1, 20, 1);
    this.addIntProperty("columns", "Columns", 2, 1, 20, 1);

    this.addColorProperty("color", "Color", new Color());

    let source = `
        vec4 process(vec2 uv)
        {
            if ((mod(float(prop_columns)*uv.x, 1.0) < 0.5) ^^ (mod(float(prop_rows)*uv.y, 1.0) < 0.5))
            {
                return vec4(prop_color.rgb, 1.0);
            }
            else
            {
                return vec4(1.0, 1.0, 1.0, 1.0);
            }
        }
        `;

    this.buildShader(source);
  }
}
