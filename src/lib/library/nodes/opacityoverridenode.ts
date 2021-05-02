import { DesignerNode, NodeInput } from "../../designer/designernode";
import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
import { Editor } from "@/lib/editor";
import { GraphicsItem, WidgetEvent } from "@/lib/scene/graphicsitem";
import { Transform2D } from "@/lib/math/transform2d";
import { Property, Transform2DProperty } from "@/lib/designer/properties";
import { Vector2, Matrix3 } from "@math.gl/core";
import { MathUtils } from "three";
import { ITransformable } from "@/lib/designer/transformable";
import { WidgetType } from "@/lib/scene/widget";
import { UndoStack } from "@/lib/undostack";
import { PropertyChangeAction } from "@/lib/actions/propertychangeaction";

export class OpacityOverrideNode extends ImageDesignerNode
  implements ITransformable {
  inputASize: Vector2;
  inputBSize: Vector2;
  relPos: Vector2;
  baseScale: Vector2;
  dragStartRelScale: Vector2;
  item: GraphicsItem;

  private _xfStarted: Transform2D;

  constructor() {
    super();

    this.widgetType = WidgetType.Transform2D;

    this.onnodepropertychanged = (prop: Property) => {
      if (prop.name === "transform2d") {
        this.requestUpdateWidget();
      }
    };

    this.onResized = () => {
      // background has changed
      const srcNode = Editor.getDesigner().findLeftNode(
        this.id,
        "opacityMap"
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
    this.title = "Opacity Override";
    this.parentIndex = "image";
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

    this.onWidgetDragStarted = (evt: WidgetEvent) => {
      const prop = this.properties.find((item) => item.name === "transform2d");
      this._xfStarted = (prop as Transform2DProperty).getValue().clone();
    };

    this.onWidgetDragEnded = (evt: WidgetEvent) => {
      const prop = this.properties.find((item) => item.name === "transform2d");

      // todo: make it happen!
      let action = new PropertyChangeAction(
        null,
        prop.name,
        this,
        { value: this._xfStarted, exposed: false },
        {
          value: (prop as Transform2DProperty).getValue().clone(),
          exposed: false,
        }
      );
      UndoStack.current.push(action);

      this.properties
        .filter((p) => p.name === "transform2d")[0]
        .setValue(this.getTransform());
      this.requestUpdateWidget();
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
        "image"
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
        Editor.getInstance().selectedNodeId = this.id;
        this.requestUpdateWidget();
      }
    };

    this.addInput("image"); // background
    this.addInput("opacityMap"); // alpha
    this.addBoolProperty("flipX", "FlipX", false);
    this.addBoolProperty("flipY", "FlipY", false);
    this.addEnumProperty("border", "Border", ["Clamp", "Stretch", "Repeat"]);

    this.addTransform2DProperty(
      "transform2d",
      "Transform",
      Transform2D.IDENTITY,
      this.id
    );

    let source = `
        uniform mat3 srcTransform;
        
        vec4 process(vec2 uv)
        {
          // foreground uv
          vec2 fuv = (srcTransform * vec3(uv, 1.0)).xy;
          // apply flip
          fuv.x = prop_flipX ? 1.0 - fuv.x : fuv.x;
          fuv.y = prop_flipY ? 1.0 - fuv.y : fuv.y;

          vec4 col = vec4(0.0);
          if (image_connected) {
            col = texture(image, uv);
          }
         
          if (opacityMap_connected) {
            col.a = overlayOpacity(opacityMap, fuv, prop_border);
          }
          
          return col;
        }
        `;

    this.buildShader(source);
  }

  render(inputs: NodeInput[]) {
    const designer = Editor.getDesigner();
    designer.findLeftNode(this.id, "opacityMap");

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
      Editor.getInstance().selectedNodeId = this.id;

      const event = new WidgetEvent("widgetUpdate", {
        detail: {
          transform2d: this.getTransformWidget(),
          dragStartRelScale: this.dragStartRelScale,
          relScale: this.getTransform().scale,
          enable: true,
          widget: this.widgetType,
        },
      });

      document.dispatchEvent(event);
    } else {
      const event = new WidgetEvent("widgetUpdate", {
        detail: {
          widget: WidgetType.None,
        },
      });

      document.dispatchEvent(event);
    }
  }

  isWidgetAvailable(): boolean {
    const colA = Editor.getDesigner().findLeftNode(this.id, "opacityMap");
    const colB = Editor.getDesigner().findLeftNode(this.id, "image");

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
