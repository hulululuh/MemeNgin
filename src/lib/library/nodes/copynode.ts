// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class CopyNode extends ImageDesignerNode {
  init() {
    this.title = "Copy";

    this.addInput("image");

    let source = `
        vec4 process(vec2 uv)
        {
            vec4 col = texture(image, uv);
            return col;
        }
        `;

    this.buildShader(source);
  }
}
