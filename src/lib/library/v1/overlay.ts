import { Editor } from "@/lib/editor";
import { WidgetEvent } from "@/lib/scene/graphicsitem";
import { DesignerNode } from "../../designer/designernode";
import { Vector2 } from "@math.gl/core";
import { Transform2D } from "@/lib/math/transform2d";

export class OverlayNode extends DesignerNode {
  init() {
    this.title = "Overlay";
    this.parentIndex = "colorB";
    this.isEditing = true;

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
            vec2 fuv = (uv - vec2(0.5)) * (colorB_size / colorA_size) + vec2(0.5);
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

  // render(inputs: NodeInput[]) {
  //   const designer = Editor.getDesigner();
  //   designer.findLeftNode(this.id, "colorA");

  //   const option = () => {
  //     if (this.isEditing) {
  //     }
  //   };

  //   super.render(inputs, option);
  // }

  connected(leftNode: DesignerNode, rightIndex: string) {
    super.connected(leftNode, rightIndex);

    let lw = leftNode.getWidth();
    let lh = leftNode.getHeight();

    // background has changed
    if (rightIndex === "colorB") {
      const srcNode = Editor.getDesigner().findLeftNode(this.id, "colorA");
      if (!srcNode) return;
      lw = srcNode.getWidth();
      lh = srcNode.getHeight();
    }

    const w = this.getWidth();
    const h = this.getHeight();

    //this.relScale
    const scale = Math.min(w, h);
    const scaleFactor = 100 / scale;

    if (document) {
      const event = new WidgetEvent("widgetUpdate", {
        detail: {
          transform2d: new Transform2D(
            this.getCenter(),
            new Vector2(lw * scaleFactor, lh * scaleFactor),
            0
          ),
          // position: new Vector2(this.getCenter()),
          // scale: new Vector2(lw * scaleFactor, lh * scaleFactor),
          // rotation: 0,
        },
      });

      document.dispatchEvent(event);
    }
  }
}
