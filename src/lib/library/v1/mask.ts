import { DesignerNode } from "../../designer/designernode";

export class MaskNode extends DesignerNode {
  public init() {
    this.title = "Mask";

    this.addInput("textureA");
    this.addInput("textureB");
    this.addInput("mask");

    var source = `
        float lum(vec4 col)
        {
            return (col.r + col.g + col.b) / 3.0;
        }

        vec4 process(vec2 uv)
        {
            vec4 a =  texture(textureA, uv);
            vec4 b =  texture(textureB, uv);
            vec4 m =  texture(mask, uv);
            float t = lum(m);

            // lerp
            return a * t + b * (1.0 - t);
        }
        `;

    this.buildShader(source);
  }
}
