import { DesignerNode, NodeInput } from "../../designer/designernode";

export class OverlayNode extends DesignerNode {
  init() {
    this.title = "Overlay";
    this.parentIndex = "colorB";

    this.addInput("colorA"); // foreground
    this.addInput("colorB"); // background
    this.addInput("opacity");

    this.addFloatProperty("opacity", "Opacity", 1.0, 0.0, 1.0, 0.01);
    this.addFloatProperty(
      "alphaThreshold",
      "Alpha Threshold",
      0.01,
      0.0,
      1.0,
      0.001
    );

    let source = `

        float screen(float fg, float bg) {
            float res = (1.0 - fg) * (1.0 - bg);
            return 1.0 - res;
        }
        vec4 process(vec2 uv)
        {
            float finalOpacity = prop_opacity;
            if (opacity_connected)
                finalOpacity *= texture(opacity, uv).r;

            // foreground uv
            vec2 fuv = uv * (colorB_size / colorA_size);
            vec4 colA = vec4(0.0);
            if (fuv.x > 0.0 && fuv.x < 1.0 && fuv.y > 0.0 && fuv.y < 1.0)
              colA = texture(colorA, fuv);
            vec4 colB = texture(colorB,uv);
            vec4 col = vec4(1.0);

            colA.a *= finalOpacity;

            float final_alpha = colA.a + colB.a * (1.0 - colA.a);
            
            if (colA.a <= prop_alphaThreshold)
                col = colB;
            else
                col = vec4(mix(colB, colA, colA.a).rgb, final_alpha);
                //col = vec4(mix(colB.rgb * colB.a, colA.rgb * colA.a, colA.a)/ final_alpha, final_alpha);
            
            return col;
        }
        `;

    this.buildShader(source);
  }
}