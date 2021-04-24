import { DesignerNode, NodeInput } from "../../designer/designernode";
import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
import { Editor } from "@/lib/editor";
import { GraphicsItem, WidgetEvent } from "@/lib/scene/graphicsitem";
import { Transform2D } from "@/lib/math/transform2d";
import { Property } from "@/lib/designer/properties";
import { Vector2, Matrix3 } from "@math.gl/core";
import { MathUtils } from "three";
import { ITransformable } from "@/lib/designer/transformable";
import { WidgetType } from "@/lib/scene/widget";

export class OverlayQuadNode extends ImageDesignerNode
  implements ITransformable {
  inputASize: Vector2;
  inputBSize: Vector2;
  relPos: Vector2;
  baseScale: Vector2;

  propTL: Property;
  propTR: Property;
  propBR: Property;
  propBL: Property;

  dragStartRelScale: Vector2;
  item: GraphicsItem;

  constructor() {
    super();

    this.widgetType = WidgetType.TransformQuad;

    this.onnodepropertychanged = (prop: Property) => {
      if (prop.name === "transform2d") {
        this.requestUpdateWidget();
      } else if (
        prop.name === "pTL" ||
        prop.name === "pTR" ||
        prop.name === "pBR" ||
        prop.name === "pBL"
      ) {
        this.requestUpdateWidget();
        this.requestUpdate();
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

      this.requestUpdateWidget();
    };
  }

  init() {
    this.title = "Overlay Quad";
    this.parentIndex = "background";
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

      const pts = evt.detail.points;
      if (pts) {
        this.setProperty(this.propTL.name, {
          value: pts[0],
          exposed: this.propTL.getExposed(),
        });

        this.setProperty(this.propTR.name, {
          value: pts[1],
          exposed: this.propTR.getExposed(),
        });

        this.setProperty(this.propBR.name, {
          value: pts[2],
          exposed: this.propBR.getExposed(),
        });

        this.setProperty(this.propBL.name, {
          value: pts[3],
          exposed: this.propBL.getExposed(),
        });
      }

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
        Editor.getInstance().selectedDesignerNode = this;
        this.requestUpdateWidget();
      }
    };

    this.addInput("image"); // foreground
    this.addInput("background"); // background
    this.addBoolProperty("flipX", "FlipX", false);
    this.addBoolProperty("flipY", "FlipY", false);

    this.addTransform2DProperty(
      "transform2d",
      "Transform",
      Transform2D.IDENTITY,
      this.id
    );

    this.propTL = this.addVector2Property(
      "pTL",
      "Point TL",
      new Vector2(-0.5, -0.5)
    );
    this.propTR = this.addVector2Property(
      "pTR",
      "Point TR",
      new Vector2(0.5, -0.5)
    );
    this.propBR = this.addVector2Property(
      "pBR",
      "Point BR",
      new Vector2(0.5, 0.5)
    );
    this.propBL = this.addVector2Property(
      "pBL",
      "Point BL",
      new Vector2(-0.5, 0.5)
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
    this.addEnumProperty("border", "Border", ["Clamp", "Stretch", "Repeat"]);

    let source = `
        uniform mat3 srcTransform;
        //uniform mat3 prop_transform2d;

        // https://www.shadertoy.com/view/lsBSDm
        float cross2d( in vec2 a, in vec2 b ) { return a.x*b.y - a.y*b.x; }

        // given a point p and a quad defined by four points {a,b,c,d}, return the bilinear
        // coordinates of p in the quad. Returns (-1,-1) if the point is outside of the quad.
        vec2 invBilinear( in vec2 p, in vec2 a, in vec2 b, in vec2 c, in vec2 d )
        {
            vec2 e = b-a;
            vec2 f = d-a;
            vec2 g = a-b+c-d;
            vec2 h = p-a;
                
            float k2 = cross2d( g, f );
            float k1 = cross2d( e, f ) + cross2d( h, g );
            float k0 = cross2d( h, e );
            
            float w = k1*k1 - 4.0*k0*k2;
            if( w<0.0 ) return vec2(-1.0);
            w = sqrt( w );

            // will fail for k0=0, which is only on the ba edge 
            float v = 2.0*k0/(-k1 - w); 
            if( v<0.0 || v>1.0 ) v = 2.0*k0/(-k1 + w);

            float u = (h.x - f.x*v)/(e.x + g.x*v);
            vec2 uv = vec2( u, 1.0-v );
            if( uv.x<0.0 || uv.x>1.0 || uv.y<0.0 || uv.y>1.0 ) return vec2(-1.0);
            return uv;
        }

        vec2 coordinate(in vec2 uv) {
          // foreground uv
          vec2 uvScaled = (inverse(srcTransform) * vec3(uv* vec2(1.0, -1.0) + vec2(0.5), 1.0)).xy;
          return uvScaled;
        }
        
        vec4 process(vec2 uv)
        {
          float finalOpacity = prop_opacity;

          // foreground uv
          vec2 fuv = invBilinear(uv, coordinate(prop_pTL), coordinate(prop_pTR), coordinate(prop_pBR), coordinate(prop_pBL));

          // apply flip
          fuv.x = prop_flipX ? 1.0 - fuv.x : fuv.x;
          fuv.y = prop_flipY ? 1.0 - fuv.y : fuv.y;
          
          vec4 colA = vec4(0.0);
          if (image_connected) {
            colA = overlayColor(image, fuv, prop_border);
          }
          vec4 colB = texture(background,uv);
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
          widget: WidgetType.TransformQuad,
          points: [
            this.getProperty(this.propTL.name),
            this.getProperty(this.propTR.name),
            this.getProperty(this.propBR.name),
            this.getProperty(this.propBL.name),
          ],
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
    const colA = Editor.getDesigner().findLeftNode(this.id, "image");
    const colB = Editor.getDesigner().findLeftNode(this.id, "background");

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
