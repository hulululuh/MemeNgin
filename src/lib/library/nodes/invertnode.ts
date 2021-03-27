import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class InvertNode extends ImageDesignerNode {
  init() {
    this.title = "Invert";

    this.addInput("color");

    let source = `
        vec4 process(vec2 uv)
        {
          vec4 tex = texture(color, uv);
          vec4 col = vec4(1.0) - tex;
          col.a = tex.a;
          return col;
        }
        `;

    this.buildShader(source);
  }
}
