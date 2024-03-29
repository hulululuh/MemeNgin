// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { DesignerNode, NodeInput } from "../../designer/designernode";
import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
import { Editor } from "@/lib/editor";
import { GraphicsItem } from "@/lib/scene/graphicsitem";
import { Transform2D } from "@/lib/math/transform2d";
import { Property } from "@/lib/designer/properties";
import { Vector2, Matrix3 } from "@math.gl/core";
import { MathUtils } from "three";
import { Color } from "@/lib/designer/color";

export class ResizeNode extends ImageDesignerNode {
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
      if (prop.name === "width") {
        this.desiredWidth = parseInt(prop.getValue());
        this.checkAndApplyResize();
      } else if (prop.name === "height") {
        this.desiredHeight = parseInt(prop.getValue());
        this.checkAndApplyResize();
      }
    };

    this.onResized = () => {
      // background has changed
      const srcNode = Editor.getDesigner().findLeftNode(
        this.id,
        "image"
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
    };

    this.onPropertyLoaded = () => {
      this.desiredWidth = parseInt(this.getProperty("width"));
      this.desiredHeight = parseInt(this.getProperty("height"));

      this.resize(this.getWidth(), this.getHeight());
      this.requestUpdate();
    };
  }

  init() {
    this.title = "Resize";
    this.parentIndex = "image";
    this.isEditing = true;
    this.inputASize = new Vector2(100, 100);
    this.inputBSize = new Vector2(100, 100);

    this.baseScale = new Vector2(1, 1);
    this.dragStartRelScale = new Vector2(1, 1);

    this.onConnected = (leftNode: DesignerNode, rightIndex: string) => {
      // background has changed

      let parentNode = this.getParentNode();
      if (!parentNode) return;

      const srcNode = parentNode as ImageDesignerNode;

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
    };

    this.addEnumProperty("resizePolicy", "ResizePolicy", [
      "FitHeight",
      "FitWidth",
      "FitContent",
      "Stretch",
    ]);

    this.addInput("image"); // foreground

    this.addIntProperty("width", "Width", 1024, 256, 2048);
    this.addIntProperty("height", "Height", 1024, 256, 2048);
    this.addColorProperty("background", "Background", new Color(0, 0, 0, 0));
    this.addBoolProperty("flipX", "FlipX", false);
    this.addBoolProperty("flipY", "FlipY", false);

    let source = `
        uniform mat3 srcTransform;
        
        vec4 process(vec2 uv)
        {
          // foreground uv
          vec2 fuv = (srcTransform * vec3(uv, 1.0)).xy;
          // apply flip
          fuv.x = prop_flipX ? 1.0 - fuv.x : fuv.x;
          fuv.y = prop_flipY ? 1.0 - fuv.y : fuv.y;

          vec4 colA = vec4(0.0);
          if (fuv.x > 0.0 && fuv.x < 1.0 && fuv.y > 0.0 && fuv.y < 1.0)
            colA = texture(image, fuv);
          vec4 colB = prop_background;
          vec4 col = vec4(1.0);

          float final_alpha = colA.a + colB.a * (1.0 - colA.a);
          col = vec4(mix(colB, colA, colA.a).rgb, final_alpha);

          return col;
        }
        `;

    this.buildShader(source);
  }

  checkAndApplyResize() {
    if (this.width != this.getWidth() || this.height != this.getHeight()) {
      this.resize(this.getWidth(), this.getHeight());
      this.requestUpdate();
    }
  }

  createTexture() {
    this.checkAndApplyResize();
    this.refreshInputSize();
    super.createTexture();
  }

  render(inputs: NodeInput[]) {
    const designer = Editor.getDesigner();
    designer.findLeftNode(this.id, "image");

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

  refreshInputSize(): void {
    const srcNode = this.getParentNode() as ImageDesignerNode;
    // background has changed
    if (srcNode) {
      let lw = srcNode.getWidth();
      let lh = srcNode.getHeight();

      const w = this.getWidth();
      const h = this.getHeight();

      this.inputASize = new Vector2(lw, lh);
      this.inputBSize = new Vector2(w, h);
    }
  }

  getWidth(): number {
    return this.desiredWidth;
  }

  getHeight(): number {
    return this.desiredHeight;
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

    let policy = this.getProperty("resizePolicy");
    let s = new Vector2(1, 1);

    const sw = this.inputASize[0] / this.inputBSize[0];
    const sh = this.inputASize[1] / this.inputBSize[1];
    switch (policy) {
      case 0: // Fit Height
        s.set(sh, sh);
        break;
      case 1: // Fit Width
        s.set(sw, sw);
        break;
      case 2: // Fit Content
        const sMin = sw > sh ? sw : sh;
        s.set(sMin, sMin);
        break;
      case 3: // Stretch
        s.set(sw, sh);
        break;
    }

    const xf = new Transform2D(new Vector2(0, 0), new Vector2(1, 1), 0);

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
      .multiplyRight(
        new Matrix3().scale(new Vector2(1 / prop / s[0], 1 / s[1]))
      )
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
