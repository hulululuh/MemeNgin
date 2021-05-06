import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
import { DesignerNode } from "@/lib/designer/designernode";
import { Property } from "@/lib/designer/properties";
import { Editor } from "@/lib/editor";

const ABOUT_TEN_FRAMES = 166;

export class ImgSelectorNode extends ImageDesignerNode {
  selProp: Property;
  constructor() {
    super();

    this.onnodepropertychanged = (prop: Property) => {
      if (prop.name === "sel") {
        this.tryResize();
      }
    };

    this.onConnected = (leftNode: DesignerNode, rightIndex: string) => {
      if (leftNode instanceof ImageDesignerNode) this.tryResize();
    };
  }

  init() {
    this.title = "ImgSelector";

    this.addInput("imageA");
    this.addInput("imageB");

    this.selProp = this.addBoolProperty("sel", "Sel", false);
    this.selProp.setExposed(true);

    let source = `
        vec4 process(vec2 uv)
        {
          vec4 col = vec4(0.0, 0.0, 0.0, 1.0);
            if (prop_sel && imageB_connected) {
              col = texture(imageB, uv);
            } else if(!prop_sel && imageA_connected) {
              col = texture(imageA, uv);
            }
            return col;
        }
        `;

    this.buildShader(source);
  }

  protected tryResize() {
    let sel = this.getProperty(this.selProp.name);
    let selectedInput = !sel ? "imageA" : "imageB";
    let selectedNode = Editor.getDesigner().findLeftNode(
      this.id,
      selectedInput
    );
    if (selectedNode) {
      this.parentIndex = selectedInput;
      this.resizeByNode(selectedNode);
      this.createTexture();
      this.requestUpdate();
    } else {
      setTimeout(() => this.tryResize(), ABOUT_TEN_FRAMES);
    }
  }
}
