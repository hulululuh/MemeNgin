// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { NodeInput } from "@/lib/designer/designernode";
import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class OutputNode extends ImageDesignerNode {
  constructor() {
    super();

    this.onResized = () => {
      // if the result node size has changed, we should resize 2d canvas also
      let event = new CustomEvent("resizeImage", {
        detail: {
          width: this.getWidth(),
          height: this.getHeight(),
        },
      });

      if (document) document.dispatchEvent(event);
    };
  }

  init() {
    this.title = "Output";

    this.addInput("image");
    //this.addStringProperty("description", "Description");

    let source = `
      vec4 process(vec2 uv)
      {
        vec4 col;
        if (image_connected) {
          col = texture(image, uv);
          // doing this for gif transparency
          if (col.a < 1.0 / 256.0) {
            col = vec4(0, 0, 0, 0);
          }
        } else {
          col = vec4(1, 1, 1, 1);
        }
        return col;
      }
      `;

    this.buildShader(source);
  }

  render(inputs: NodeInput[], optional?: Function) {
    super.render(inputs, optional);
    document.dispatchEvent(new Event("frameRendered"));
  }
}
