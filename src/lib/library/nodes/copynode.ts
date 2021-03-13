import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class CopyNode extends ImageDesignerNode {
  init() {
    this.title = "Copy";

    this.addInput("image");
    this.addStringProperty("name", "Name");

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