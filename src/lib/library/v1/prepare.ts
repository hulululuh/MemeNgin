import { DesignerNode, NodeInput } from "../../designer/designernode";
import { Editor } from "@/lib/editor";
import { GraphicsItem, WidgetEvent } from "@/lib/scene/graphicsitem";
import { Transform2D } from "@/lib/math/transform2d";
import { Property } from "@/lib/designer/properties";
import { Vector2, Matrix3 } from "@math.gl/core";
import { MathUtils } from "three";
import { ITransformable } from "@/lib/designer/transformable";
import { Color } from "@/lib/designer/color";

export class PrepareNode extends DesignerNode implements ITransformable {
  inputASize: Vector2;
  inputBSize: Vector2;
  relPos: Vector2;
  baseScale: Vector2;
  dragStartRelScale: Vector2;
  item: GraphicsItem;

  desiredWidth: number;
  desiredHeight: number;

  constructor() {
    super();

    this.desiredWidth = 1024;
    this.desiredHeight = 1024;

    this.onnodepropertychanged = (prop: Property) => {
      const checkAndApplyResize = function(node: PrepareNode) {
        if (
          !node.inheritParentSize &&
          node.desiredWidth > 0 &&
          node.desiredHeight > 0
        ) {
          node.resize(node.getWidth(), node.getHeight());
          node.requestUpdate();
          node.requestUpdateWidget();
        }
      };

      if (prop.name === "transform2d") {
        this.requestUpdateWidget();
      } else if (prop.name === "width") {
        this.desiredWidth = parseInt(prop.getValue());
        checkAndApplyResize(this);
      } else if (prop.name === "height") {
        this.desiredHeight = parseInt(prop.getValue());
        checkAndApplyResize(this);
      } else if (prop.name === "inherit") {
        this.inheritParentSize = prop.getValue();
        checkAndApplyResize(this);
      }
    };

    this.onResized = (width: number, height: number) => {
      // background has changed
      const srcNode = Editor.getDesigner().findLeftNode(this.id, "colorA");
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
    this.title = "Prepare";
    this.parentIndex = "colorA";
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

    this.onPropertyLoadFinished = () => {
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
      let lw = leftNode.getWidth();
      let lh = leftNode.getHeight();

      // background has changed
      const srcNode = Editor.getDesigner().findLeftNode(this.id, "colorA");
      if (!srcNode) return;
      lw = srcNode.getWidth();
      lh = srcNode.getHeight();

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

    this.addBoolProperty("inherit", "Inherit", true);
    this.addIntProperty("width", "Width", 1024, 256, 2048);
    this.addIntProperty("height", "Height", 1024, 256, 2048);
    this.addColorProperty("background", "Background", new Color(0, 0, 0, 0));

    this.addTransform2DProperty(
      "transform2d",
      "Transform",
      Transform2D.IDENTITY
    );

    let source = `
        uniform mat3 srcTransform;
        
        vec4 process(vec2 uv)
        {
            // foreground uv
            vec2 fuv = (srcTransform * vec3(uv, 1.0)).xy;
            vec4 colA = vec4(0.0);
            if (fuv.x > 0.0 && fuv.x < 1.0 && fuv.y > 0.0 && fuv.y < 1.0)
              colA = texture(colorA, fuv);
            vec4 colB = prop_background;
            vec4 col = vec4(1.0);

            float final_alpha = colA.a + colB.a * (1.0 - colA.a);
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

    if (colA) {
      return true;
    }
    return false;
  }

  getWidth(): number {
    if (this.inheritParentSize) {
      return super.getWidth();
    } else {
      return this.desiredWidth;
    }
  }

  getHeight(): number {
    if (this.inheritParentSize) {
      return super.getHeight();
    } else {
      return this.desiredHeight;
    }
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
