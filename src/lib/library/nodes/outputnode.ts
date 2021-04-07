import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class OutputNode extends ImageDesignerNode {
  init() {
    this.title = "Output";

    this.addInput("image");

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
