import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
import { Gradient } from "@/lib/designer/gradient";

export class GradientMapNode extends ImageDesignerNode {
  init() {
    this.title = "GradientMap";

    this.addInput("image");

    this.addGradientProperty("gradient", "Gradient", Gradient.default());

    let source = `
        float grayscale(vec3 col)
        {
            return (col.r + col.g + col.b) / 3.0;
        }

        vec4 process(vec2 uv)
        {
            // grayscale input color
            vec4 colA = texture(image, uv);
            float t = grayscale(colA.rgb);
            vec3 col = sampleGradient(prop_gradient, t);
            
            return vec4(col, colA.a);
        }
          `;

    this.buildShader(source);
  }
}
