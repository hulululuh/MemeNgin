// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class MaskNode extends ImageDesignerNode {
  init() {
    this.title = "Mask";
    this.parentIndex = "imageB";

    this.addInput("imageA");
    this.addInput("imageB");
    this.addInput("maskMap");

    let source = `
        float lum(vec4 col)
        {
            return (col.r + col.g + col.b) / 3.0;
        }

        vec4 process(vec2 uv)
        {
            vec2 foreground_uv = clamp(uv * (imageB_size / imageA_size), 0.0, 1.0);
            vec4 a =  texture(imageA, foreground_uv);
            vec4 b =  texture(imageB, uv);
            vec4 m =  texture(maskMap, uv);
            float t = lum(m);

            // lerp
            return a * t + b * (1.0 - t);
        }
        `;

    this.buildShader(source);
  }
}
