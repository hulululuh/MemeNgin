import { DesignerNode, NodeInput } from "@/lib/designer/designernode";
import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
import { Property } from "@/lib/designer/properties";
import { ITransformable } from "@/lib/designer/transformable";
import { Editor } from "@/lib/editor";
import { GraphicsItem, WidgetEvent } from "@/lib/scene/graphicsitem";
import { Transform2D } from "@/lib/math/transform2d";
import { Vector2, Matrix3 } from "@math.gl/core";
import { MathUtils } from "three";

export class BlendNode extends ImageDesignerNode implements ITransformable {
  inputASize: Vector2;
  inputBSize: Vector2;
  relPos: Vector2;
  baseScale: Vector2;
  dragStartRelScale: Vector2;
  item: GraphicsItem;

  constructor() {
    super();

    this.onnodepropertychanged = (prop: Property) => {
      if (prop.name === "transform2d") {
        this.requestUpdateWidget();
      }
    };

    this.onResized = () => {
      // background has changed
      const srcNode = Editor.getDesigner().findLeftNode(
        this.id,
        "colorA"
      ) as ImageDesignerNode;
      if (!srcNode) return;
      let lw = srcNode.getWidth();
      let lh = srcNode.getHeight();

      const w = this.getWidth();
      const h = this.getHeight();

      this.inputASize = new Vector2(lw, lh);
      this.inputBSize = new Vector2(w, h);

      const scale = Math.min(w, h);
      const scaleFactor = 100 / scale;

      this.baseScale = new Vector2(lw * scaleFactor, lh * scaleFactor);

      this.requestUpdateWidget();
    };
  }

  init() {
    this.title = "Blend";
    this.parentIndex = "colorB";
    this.isEditing = true;
    this.inputASize = new Vector2(100, 100);
    this.inputBSize = new Vector2(100, 100);

    this.baseScale = new Vector2(1, 1);
    this.dragStartRelScale = new Vector2(1, 1);

    this.onWidgetDragged = (evt: WidgetEvent) => {
      if (!this.item) {
        this.item = Editor.getScene().getNodeById(this.id);
      }

      this.relPos = new Vector2(evt.detail.transform2d.position)
        .sub(new Vector2(this.item.centerX(), this.item.centerY()))
        .divide(new Vector2(this.item.getWidth(), this.item.getHeight() * -1));

      const xf = new Transform2D(
        this.relPos,
        evt.detail.transform2d.scale,
        evt.detail.transform2d.rotation * MathUtils.RAD2DEG
      );

      this.properties.filter((p) => p.name === "transform2d")[0].setValue(xf);

      this.dragStartRelScale = new Vector2(evt.detail.dragStartRelScale);

      this.createTexture();
      this.requestUpdate();
    };

    this.onPropertyLoaded = () => {
      this.properties
        .filter((p) => p.name === "transform2d")[0]
        .setValue(this.getTransform());
      this.requestUpdateWidget();
    };

    this.onItemSelected = () => {
      this.properties
        .filter((p) => p.name === "transform2d")[0]
        .setValue(this.getTransform());
      this.requestUpdateWidget();
    };

    this.onConnected = (leftNode: DesignerNode, rightIndex: string) => {
      const leftImageNode = leftNode as ImageDesignerNode;
      const srcNode = Editor.getDesigner().findLeftNode(
        this.id,
        "colorA"
      ) as ImageDesignerNode;

      // background has changed
      if (!srcNode || !leftImageNode) return;

      let lw = srcNode.getWidth();
      let lh = srcNode.getHeight();

      const w = this.getWidth();
      const h = this.getHeight();

      this.inputASize = new Vector2(lw, lh);
      this.inputBSize = new Vector2(w, h);

      const scale = Math.min(w, h);
      const scaleFactor = 100 / scale;

      this.baseScale = new Vector2(lw * scaleFactor, lh * scaleFactor);
      this.dragStartRelScale = new Vector2(1, 1);

      if (this.isWidgetAvailable()) {
        Editor.getInstance().selectedDesignerNode = this;
        this.requestUpdateWidget();
      }
    };

    this.addInput("colorA"); // foreground
    this.addInput("colorB"); // background
    this.addBoolProperty("flipX", "FlipX", false);
    this.addBoolProperty("flipY", "FlipY", false);

    this.addEnumProperty("type", "Type", [
      "Multiply",
      "Add",
      "Subtract",
      "Divide",
      "Max",
      "Min",
      "Switch",
      "Overlay",
      "Screen",
    ]);
    this.addEnumProperty("border", "Border", ["Clamp", "Stretch", "Repeat"]);

    this.addTransform2DProperty(
      "transform2d",
      "Transform",
      Transform2D.IDENTITY
    );

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
        
        float screen(float fg, float bg) {
          float res = (1.0 - fg) * (1.0 - bg);
          return 1.0 - res;
        }
        
        vec4 process(vec2 uv)
        {
            float finalOpacity = prop_opacity;

            // foreground uv
            vec2 fuv = (srcTransform * vec3(uv, 1.0)).xy;

            // apply flip
            fuv.x = prop_flipX ? 1.0 - fuv.x : fuv.x;
            fuv.y = prop_flipY ? 1.0 - fuv.y : fuv.y;
            
            vec4 colA = vec4(0.0);
            if (colorA_connected) {
              colA = overlayColor(colorA, fuv, prop_border);
            }
            vec4 colB = texture(colorB,uv);
            vec4 col = vec4(1.0);

            // clipped - skip blending
            if(colA.a < margin) {
              return colB;
            }

            colA.a *= finalOpacity;

            float final_alpha = colA.a + colB.a * (1.0 - colA.a);

            if (prop_type==0){ // multiply
              col.rgb = colA.rgb * colB.rgb;
            }
            if (prop_type==1) // add
                col.rgb = colA.rgb + colB.rgb;
            if (prop_type==2) // subtract
                col.rgb = colB.rgb - colA.rgb;
            if (prop_type==3) // divide
                col.rgb = colB.rgb / colA.rgb;
            if (prop_type==4) { // max
                col.rgb = max(colA.rgb, colB.rgb);
            }
            if (prop_type==5) { // min
                col.rgb = min(colA.rgb, colB.rgb);
            }
            if (prop_type==6) { // switch
                col.rgb = colA.rgb;
            }
            if (prop_type==7) { // overlay
                float final_alpha = colA.a + colB.a * (1.0 - colA.a);
                if (colA.a <= prop_alphaThreshold)
                    col = colB;
                else
                    col = vec4(mix(colB, colA, colA.a).rgb, final_alpha);
                
                return col;
            }
            if (prop_type==8) { // screen
                col.r = screen(colA.r, colB.r);
                col.g = screen(colA.g, colB.g);
                col.b = screen(colA.b, colB.b);
            }
            
            //col.a = final_alpha;
            vec4 blended = mix(colB, col, prop_opacity);
            return blended;
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
        gl.uniformMatrix3fv(
          gl.getUniformLocation(this.shaderProgram, "srcTransform"),
          false,
          this.getTransformGL().toFloat32Array()
        );
      }
    };

    super.render(inputs, option);
  }

  requestUpdateWidget(): void {
    if (!document) return;
    if (this.isWidgetAvailable()) {
      // select this in order to activate transform2d widget
      Editor.getInstance().selectedDesignerNode = this;

      const event = new WidgetEvent("widgetUpdate", {
        detail: {
          transform2d: this.getTransformWidget(),
          dragStartRelScale: this.dragStartRelScale,
          relScale: this.getTransform().scale,
          enable: true,
        },
      });

      document.dispatchEvent(event);
    } else {
      const event = new WidgetEvent("widgetUpdate", {
        detail: {
          enable: false,
        },
      });

      document.dispatchEvent(event);
    }
  }

  isWidgetAvailable(): boolean {
    const colA = Editor.getDesigner().findLeftNode(this.id, "colorA");
    const colB = Editor.getDesigner().findLeftNode(this.id, "colorB");

    if (colA && colB) {
      return true;
    }
    return false;
  }

  getTransformWidget(): Transform2D {
    const xf = this.getTransform();
    if (!this.item) {
      this.item = Editor.getScene().getNodeById(this.id);
    }
    const offsetPos = new Vector2(xf.position).multiply(
      new Vector2(this.item.getWidth(), this.item.getHeight() * -1)
    );
    return new Transform2D(
      new Vector2(this.getCenter()).add(offsetPos),
      new Vector2(this.baseScale).multiply(xf.scale),
      xf.rotation * MathUtils.DEG2RAD
    );
  }

  getTransform(): Transform2D {
    return this.properties
      .filter((p) => p.name === "transform2d")[0]
      .getValue();
  }

  getTransformGL(): Matrix3 {
    if (!this.item) {
      this.item = Editor.getScene().getNodeById(this.id);
    }

    const xf = this.properties
      .filter((p) => p.name === "transform2d")[0]
      .getValue();

    this.relPos = new Vector2(xf.position);

    const scale = new Vector2(xf.scale);
    const rotation = xf.rotation * MathUtils.DEG2RAD;

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
      .multiplyRight(new Matrix3().rotate(rotation).transpose())
      .multiplyRight(
        new Matrix3()
          .scale(new Vector2(prop, 1))
          .multiplyRight(new Matrix3().scale(new Vector2(scale)))
      )
      .multiplyRight(new Matrix3().translate(new Vector2(-0.5, -0.5)));
    transMat.invert();

    return transMat;
  }
}
