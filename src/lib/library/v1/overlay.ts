import { DesignerNode, NodeInput } from "../../designer/designernode";
import { Editor } from "@/lib/editor";
import { GraphicsItem, WidgetEvent } from "@/lib/scene/graphicsitem";
import { Transform2D } from "@/lib/math/transform2d";
import { Vector2, Matrix3 } from "@math.gl/core";

export class OverlayNode extends DesignerNode {
  srcTransform: Transform2D;
  inputASize: Vector2;
  inputBSize: Vector2;
  relPos: Vector2;
  baseScale: Vector2;
  item: GraphicsItem;
  dragStartRelScale: Vector2;
  relScale: Vector2;

  init() {
    this.title = "Overlay";
    this.parentIndex = "colorB";
    this.isEditing = true;
    this.inputASize = new Vector2(100, 100);
    this.inputBSize = new Vector2(100, 100);

    this.baseScale = new Vector2(1, 1);
    this.dragStartRelScale = new Vector2(1, 1);
    this.relScale = new Vector2(1, 1);

    this.srcTransform = new Transform2D(
      new Vector2(0, 0),
      new Vector2(1, 1),
      0
    );

    this.onWidgetDragged = (evt: WidgetEvent) => {
      if (!this.item) {
        this.item = Editor.getScene().getNodeById(this.id);
      }

      this.relPos = new Vector2(evt.detail.transform2d.position)
        .sub(new Vector2(this.item.centerX(), this.item.centerY()))
        .divide(new Vector2(this.item.getWidth(), this.item.getHeight() * -1));

      //this.srcTransform = evt.detail.transform2d.clone();
      this.srcTransform = new Transform2D(
        this.relPos,
        evt.detail.transform2d.scale,
        evt.detail.transform2d.rotation
      );

      this.dragStartRelScale = new Vector2(evt.detail.dragStartRelScale);
      this.relScale = new Vector2(evt.detail.relScale);

      this.createTexture();
      this.requestUpdate();
    };

    this.onItemSelected = () => {
      this.requestUpdateWidget();
    };

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
        uniform mat3 srcTransform;
        
        vec4 process(vec2 uv)
        {
            float finalOpacity = prop_opacity;
            if (opacity_connected)
                finalOpacity *= texture(opacity, uv).r;

            vec2 p = vec2(256.0, 256.0);
            vec2 s = vec2(2.0, 1.0);

            // foreground uv
            vec2 fuv = (srcTransform * vec3(uv, 1.0)).xy;
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
            
            return col;
        }
        `;

    this.buildShader(source);
  }

  render(inputs: NodeInput[]) {
    const designer = Editor.getDesigner();
    designer.findLeftNode(this.id, "colorA");

    const option = () => {
      if (this.isEditing) {
        const gl = this.gl;
        if (this.srcTransform) {
          const prop = this.inputASize[0] / this.inputASize[1];
          const transMat = new Matrix3()
            .translate(new Vector2(this.relPos))
            .multiplyRight(new Matrix3().translate(new Vector2(0.5, 0.5)))
            .multiplyRight(
              new Matrix3().scale(
                new Vector2(this.inputASize).divide(this.inputBSize)
              )
            )
            .multiplyRight(new Matrix3().scale(new Vector2(1 / prop, 1)))
            .multiplyRight(
              new Matrix3().rotate(this.srcTransform.rotation).transpose()
            )
            .multiplyRight(
              new Matrix3()
                .scale(new Vector2(prop, 1))
                .multiplyRight(
                  new Matrix3().scale(new Vector2(this.srcTransform.scale))
                )
            )
            .multiplyRight(new Matrix3().translate(new Vector2(-0.5, -0.5)));
          transMat.invert();

          gl.uniformMatrix3fv(
            gl.getUniformLocation(this.shaderProgram, "srcTransform"),
            false,
            transMat.toFloat32Array()
          );
        }
      }
    };

    super.render(inputs, option);
  }

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

    this.inputASize = new Vector2(lw, lh);
    this.inputBSize = new Vector2(w, h);

    //this.relScale
    const scale = Math.min(w, h);
    const scaleFactor = 100 / scale;

    this.baseScale = new Vector2(lw * scaleFactor, lh * scaleFactor);
    this.dragStartRelScale = new Vector2(1, 1);
    this.relScale = new Vector2(1, 1);

    this.requestUpdateWidget();
  }

  requestUpdateWidget(): void {
    if (document && this.isWidgetAvailable) {
      // select this in order to activate transform2d widget
      Editor.getInstance().selectedDesignerNode = this;

      const event = new WidgetEvent("widgetUpdate", {
        detail: {
          transform2d: this.widgetTransform,
          dragStartRelScale: this.dragStartRelScale,
          relScale: this.relScale,
          enable: true,
        },
      });

      document.dispatchEvent(event);
    }
  }

  get isWidgetAvailable(): boolean {
    const colA = Editor.getDesigner().findLeftNode(this.id, "colorA");
    const colB = Editor.getDesigner().findLeftNode(this.id, "colorB");

    if (colA && colB) {
      return true;
    }
    return false;
  }

  get widgetTransform(): Transform2D {
    if (!this.item) {
      this.item = Editor.getScene().getNodeById(this.id);
    }
    const offsetPos = new Vector2(this.srcTransform.position).multiply(
      new Vector2(this.item.getWidth(), this.item.getHeight() * -1)
    );
    return new Transform2D(
      new Vector2(this.getCenter()).add(offsetPos),
      new Vector2(this.baseScale).multiply(this.srcTransform.scale),
      this.srcTransform.rotation
    );
  }
}
