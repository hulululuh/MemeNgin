import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class HeightShiftNode extends ImageDesignerNode {
  init() {
    this.title = "Height Shift";

    this.addInput("image");

    this.addFloatProperty("shift", "Shift", 0.0, -1.0, 1.0, 0.01);

    let source = `
        vec4 process(vec2 uv)
        {
            vec4 a =  texture(image, uv);

            return a + vec4(vec3(prop_shift), 0.0);
        }
        `;

    this.buildShader(source);
  }
}
