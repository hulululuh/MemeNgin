// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class UvSwapNode extends ImageDesignerNode {
  init() {
    this.title = "UvSwap";
    this.parentIndex = "uvMap";

    this.addInput("foreground");
    this.addInput("uvMap");
    this.addInput("background");

    let source = `
      const float epsilon = 1.5/255.0;

      vec4 process(vec2 uv)
      {
        vec4 fCol = vec4(0.0, 0.0, 0.0, 1.0);
        vec4 bCol = vec4(0.0, 0.0, 0.0, 1.0);
        if (uvMap_connected) {
          vec4 coord = texture(uvMap, uv);
          bool isBlack = coord.x < epsilon && coord.y < epsilon;
          if (foreground_connected) {
            fCol = texture(foreground, coord.xy);
            if (isBlack) {
              fCol.a = 0.0;
            } else {
              fCol.a *= coord.a;
            }
          } else {
            fCol = vec4(coord.xy, 0.0, 1.0);
          }
        }

        if (background_connected) {
          bCol = texture(background, uv);
        }

        return mix(fCol, bCol, 1.0-fCol.a);
      }
      `;

    this.buildShader(source);
  }
}
