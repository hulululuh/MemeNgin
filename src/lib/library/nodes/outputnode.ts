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
    this.addStringProperty("description", "Description");

    let source = `
      vec4 process(vec2 uv)
      {
        vec4 col;
        if (image_connected) {
          col = texture(image, uv);
        } else {
          col = vec4(1, 1, 1, 1);
        }
        return col;
      }
      `;

    this.buildShader(source);
  }
}
