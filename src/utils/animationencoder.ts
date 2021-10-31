const GIFEncoder = require("gif-encoder-2");

export class AnimationEncoder {
  private static instance: AnimationEncoder;
  encoder: any = null;
  public encoded: boolean = false;
  public isDirty: boolean = false;

  constructor() {
    AnimationEncoder.instance = this;
    document.addEventListener("editing", () => {
      this.isDirty = true;
    });

    document.addEventListener("propertyChanged", () => {
      this.isDirty = true;
    });
  }

  static getInstance() {
    if (!AnimationEncoder.instance) {
      AnimationEncoder.instance = new AnimationEncoder();
    }

    return AnimationEncoder.instance;
  }

  init(
    width: number,
    height: number,
    algorithm: string,
    opt: boolean,
    numFrames: number
  ) {
    if (this.encoder) {
      this.encoder = null;
      this.encoded = false;
    }
    // 1 is best quality and slowest to 30 is fastest
    this.encoder = new GIFEncoder(width, height, algorithm, opt, numFrames);
    this.encoder.setQuality(1);
  }

  start() {
    this.encoder.start();
  }

  finish() {
    this.encoder.finish();
    this.encoded = this.encoder.out && this.encoder.out.data.length > 0;
    this.isDirty = false;
  }

  setDelay(delay: number) {
    this.encoder.setDelay(delay);
  }

  addFrame(ctx: CanvasRenderingContext2D) {
    this.encoder.addFrame(ctx);
  }

  getData(): string {
    return this.encoded ? this.encoder.out.getData() : "";
  }

  async getGifAsString() {
    if (this.encoded) {
      const gifAsString = `data:image/gif;base64,${Buffer.from(
        this.encoder.out.getData(),
        "utf8"
      ).toString("base64")}`;
      return gifAsString;
    } else {
      return "";
    }
  }
}
