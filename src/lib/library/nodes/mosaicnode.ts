// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class MosaicNode extends ImageDesignerNode {
  init() {
    this.title = "Mosaic";

    this.addInput("image");
    this.addFloatProperty("scale", "Scale", 4.0, 1.0, 128.0, 1.0);

    let source = `
        vec4 process(vec2 uv)
        {
            vec4 col = vec4(0.0, 0.0, 0.0, 1.0);
            vec2 tileSizeInUv =  prop_scale / image_size;
            if (image_connected) {
                vec2 mUv = floor(uv/tileSizeInUv) * tileSizeInUv +tileSizeInUv * 0.5;
                col = texture(image, mUv);
            }

            return col;
        }
        `;

    this.buildShader(source);
  }
}
