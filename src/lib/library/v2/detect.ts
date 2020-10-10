import { DesignerNode, NodeType } from "../../designer/designernode";
import { Color } from "@/lib/designer/color";
import { SphereBufferGeometry } from "@/lib/geometry/sphere";
import { Property, FileProperty } from "@/lib/designer/properties";
import { Path } from "three";
import { resolve } from "path";
//import * as NativeImage from "@electron/nativeImage";
import { Tensor, InferenceSession } from "onnxjs";
import path from "path"

const NativeImage = require("electron").nativeImage;

//const call = "python eval.py --trained_model=weights/yolact_plus_base_54_800000.pth --score_threshold=0.5 --top_k=15 --image=my_image.png:output_image.png";


async function Load (
  modelPath: string
) {
  try {
    await DetectNode.session.loadModel(modelPath);
    console.log("model " + modelPath + " loaded");
  } catch (err) {
    DetectNode.session = undefined;
    console.log(err);
    //console.log("failed to load detect model");
  }
}

export class DetectNode extends DesignerNode {
  static session:InferenceSession;
  protected img: Electron.NativeImage;

  // constructor
  constructor() {
    const app = require("electron").remote.app;
    const appPath = app.getAppPath();

    const onnxPath = path.normalize(appPath + "/../src/assets/onnx/")
    //const modelName = "fcos_imprv_R_50_FPN_1x.onnx";
    //const modelName = "converted.onnx";
    const modelName = "converted.onnx";

    if (!DetectNode.session) {
      try {
        DetectNode.session = new InferenceSession();
      } catch(err) {
        console.log(err);
      }
    }

    // use the following in an async method
    //const modelPath = onnxPath + modelName;
    const modelPath = "./add.onnx"
    Load(modelPath).then(()=> {
      console.debug(DetectNode.session);
    });

    //const path = require("path");
    //const resolve = require("path").resolve;
    // const yolactRoot = resolve(
    //   path.normalize(appPath + "/../external_modules/yolact/")
    // );



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

    // if (prop) {
      
    // }
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
