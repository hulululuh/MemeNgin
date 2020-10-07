import { DesignerNode, NodeType } from "../../designer/designernode";
import { Color } from "@/lib/designer/color";
import { SphereBufferGeometry } from "@/lib/geometry/sphere";
import { Property, FileProperty } from "@/lib/designer/properties";
import { PythonShell } from "python-shell";
import { Path } from "three";
import { resolve } from "path";
//import * as NativeImage from "@electron/nativeImage";

const NativeImage = require("electron").nativeImage;

//const call = "python eval.py --trained_model=weights/yolact_plus_base_54_800000.pth --score_threshold=0.5 --top_k=15 --image=my_image.png:output_image.png";

export class DetectNode extends DesignerNode {
  protected img: Electron.NativeImage;

  // constructor
  constructor() {
    const app = require("electron").remote.app;
    const appPath = app.getAppPath();

    const path = require("path");
    const resolve = require("path").resolve;
    const yolactRoot = resolve(
      path.normalize(appPath + "/../external_modules/yolact/")
    );

    const pyPath = PythonShell.getPythonPath();

    const detectronPath = "C:Repo/detectron2-windows/tests/";

    const options = {
      scriptPath: yolactRoot,
      //pythonPath: pyPath,
      //args: ["--trained_model=weights/yolact_plus_base_54_800000.pth", "--score_threshold=0.5", "--top_k=15", "--image=my_image.png:output_image.png"],
      args: [
        "--trained_model=weights/yolact_plus_base_54_800000.pth",
        "--score_threshold=0.15",
        "--top_k=15",
        "--image=my_image.png:output_image.png",
      ],
    };

    PythonShell.run(
      "test_windows_install.py",
      { scriptPath: detectronPath },
      function(err) {
        if (err) {
          throw err;
        }
        console.log("finished");
      }
    );

    super();
    this.nodeType = NodeType.Texture;

    // PythonShell.run("eval.py", options, function(err) {
    //   if (err) throw err;
    //   console.log("finished");
    // });

    // let detect = new PythonShell("eval.py", options);
    // detect.on("message", function(message) {
    //   let a = 0;
    // });

    this.onnodepropertychanged = (prop: Property) => {
      if (prop.name === "file") {
        if (prop) {
          this.texPath = (prop as FileProperty).value;
          if (this.texPath) {
            this.img = NativeImage.createFromPath(this.texPath);
            const imgSize = this.img.getSize();
            this.resize(imgSize.width, imgSize.height);
            this.createTexture();
            this.requestUpdate();
          }
        }
      }
      // else if (propName === "size") {
      //   //this.createTexture();
      // }
    };
  }

  public createTexture() {
    let gl = this.gl;

    if (this.tex) {
      gl.deleteTexture(this.tex);
      this.tex = null;
    }

    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const nodetype = this.nodeType;
    let data = null;

    if (!this.img && this.texPath) {
      this.img = NativeImage.createFromPath(this.texPath);
    }

    if (this.img) {
      const image = this.img;
      const imgSize = image.getSize();
      if (image.isEmpty() === false) {
        this.width = imgSize.width;
        this.height = imgSize.height;

        this.tex = DesignerNode.updateTexture(
          level,
          internalFormat,
          imgSize.width,
          imgSize.height,
          border,
          format,
          type,
          data,
          NodeType.Procedural,
          this.gl
        );
        this.baseTex = DesignerNode.updateTexture(
          level,
          internalFormat,
          imgSize.width,
          imgSize.height,
          border,
          format,
          type,
          Uint8Array.from(image.getBitmap()),
          NodeType.Texture,
          this.gl
        );
        this.isTextureReady = true;
        this.requestUpdate();
      }
    }
  }

  public init() {
    this.title = "Detect";
    this.addInput("image");
    let fileProp = this.addFileProperty("file", "path", "", ["jpg", "png"]);

    // this happens when we drop image file into canvas
    if (this.texPath !== "") {
      fileProp.setValue(this.texPath);
    }

    let source = `
        vec4 process(vec2 uv)
        {
          vec4 col = vec4(0,1,0,1);
          if (baseTexture_ready) {
            col = texture(baseTexture, uv);
          } else {
            col = vec4(uv.x, uv.y, 0.0, 1.0);
          }
          return col;
        }
        `;

    this.buildShader(source);
  }
}
