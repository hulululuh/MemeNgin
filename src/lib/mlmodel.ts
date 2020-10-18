import path from "path"
import { Tensor, InferenceSession } from "onnxjs"
import * as runModelUtils from "@/lib/utils/runModel";

const warmupImgSize = 128;
const dimensionWarmup = [1, 3, 416, 416];
const dimension = [0, 3, 416, 416];
//const dimension = [1, 3, warmupImgSize, warmupImgSize];

function getOnnxPath() {
  const appPath = require("electron").remote.app.getAppPath();
  const onnxPath = path.normalize(appPath + "/../src/assets/onnx/")

  // Loading success
  // 1. segmentation
  //const modelName = "tinyyolov2-7.onnx";
  //const modelName = "shufflenet-6.onnx";
  //const modelName = "shufflenet-7.onnx";
  // 2. neural style transfer
  //const modelName = "pointilism-8.onnx";

  // Loading failed
  //const modelName = "fcos_imprv_R_50_FPN_1x.onnx";
  //const modelName = "tiny-yolov3-11.onnx";
  //const modelName = "shufflenet-3.onnx";
  //const modelName = "ssd_mobilenet_v1_10.onnx";
  //const modelName = "ssd-10.onnx";

  // Testing
  //const modelName = "tinyyolov2-7.onnx";
  const modelName = "yolo.onnx";

  // use the following in an async method
  const modelPath = onnxPath + modelName;

  return modelPath;
}

export class MLModel {
  sessionBackend: string;
  backendSelectList: Array<{text: string, value: string}>;
  modelLoading: boolean;
  modelInitializing: boolean;
  modelLoadingError: boolean;
  sessionRunning: boolean;  
  session: InferenceSession | undefined;
  gpuSession: InferenceSession | undefined;
  cpuSession: InferenceSession | undefined;

  inferenceTime: number;
  imageURLInput: string;
  imageURLSelect: null;
  imageURLSelectList: Array<{text: string, value: string}>;
  imageLoading: boolean;
  imageLoadingError: boolean;
  output: Tensor.DataType;
  modelFile: ArrayBuffer;

  warmupImgSize: number;

  constructor() {
    this.sessionBackend = 'webgl';
    this.backendSelectList = [{text: 'GPU-WebGL', value: 'webgl'}, {text: 'CPU-WebAssembly', value: 'wasm'}];
    this.modelLoading = true;
    this.modelInitializing = true;
    this.modelLoadingError = false;
    this.sessionRunning = false;
    this.inferenceTime = 0;
    this.imageURLInput = '';
    this.imageURLSelect = null;
    //this.imageURLSelectList = this.imageUrls;
    this.imageLoading = false;
    this.imageLoadingError = false;
    this.output = [];
    this.modelFile = new ArrayBuffer(0);

    this.created();
  }

  async created() {
    // fetch the model file to be used later
    const modelPath = getOnnxPath();
    const response = await fetch(modelPath);
    this.modelFile = await response.arrayBuffer();
    try {
      await this.initSession();
      console.log(modelPath + "Loaded");
    } catch (e) {
      this.sessionBackend = 'wasm';
    }
  }

  async initSession() {
    this.sessionRunning = false;
    this.modelLoadingError = false;
    if (this.sessionBackend === 'webgl') { 
      if (this.gpuSession) {
        this.session = this.gpuSession;
        return;
      }
      this.modelLoading = true;
      this.modelInitializing = true;  
      this.gpuSession = new InferenceSession({backendHint: this.sessionBackend});
      this.session = this.gpuSession;
    }
    if (this.sessionBackend === 'wasm') {        
      if (this.cpuSession) {
        this.session = this.cpuSession;
        return;
      }
      this.modelLoading = true;
      this.modelInitializing = true;  
      this.cpuSession = new InferenceSession({backendHint: this.sessionBackend});
      this.session = this.cpuSession;
    }    
    
    try {
      await this.session!.loadModel(this.modelFile);
    } catch (e){
      this.modelLoading = false;
      this.modelInitializing = false;
      if (this.sessionBackend === 'webgl') {
        this.gpuSession = undefined;
      } else {
        this.cpuSession = undefined;
      }
      throw new Error('Error: Backend not supported. ');
    }
    this.modelLoading = false;
    // warm up session with a sample tensor. Use setTimeout(..., 0) to make it an async execution so 
    // that UI update can be done.
    if (this.sessionBackend === 'webgl') {
      setTimeout(() => {
        runModelUtils.warmupModel(this.session!, dimensionWarmup);
        this.modelInitializing = false;

      }, 0);
    } else {
      await runModelUtils.warmupModel(this.session!, dimensionWarmup);
      this.modelInitializing = false;
    }
    
  }

}