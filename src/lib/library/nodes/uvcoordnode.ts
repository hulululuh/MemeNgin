// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class UvCoordNode extends ImageDesignerNode {
  init() {
    this.title = "UvCoord";

    let source = `
        vec4 process(vec2 uv)
        {
            return vec4(uv, 0.0, 1.0);
        }
        `;

    this.buildShader(source);
  }
}
