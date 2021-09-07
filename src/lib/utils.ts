// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import path from "path";
import { WorkshopManager } from "@/community/workshop";
import { NodeType } from "@/lib/designer/designernode";
import { Vector2 } from "@math.gl/core";
import { GifUtil, GifCodec } from "gifwrap";
const NativeImage = require("electron").nativeImage;
const codec = new GifCodec();

export const TEMP_PATH = path.join(path.resolve("."), "/projects/temp/");
export const RESOURCE_PATH = path.join(path.resolve("."), "/resources/");
export const MY_WORKS_PATH = path.join(
  path.resolve("."),
  "/projects/my_works/"
);

export class Guid {
  static newGuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      let r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export async function loadGif(imgPath: string, isDataUrl: boolean) {
  if (isDataUrl) {
    console.log(imgPath);

    // codec.decodeGif(path).then((sourceGif) => {
    //   const edgeLength = Math.min(sourceGif.width, sourceGif.height);
    //   sourceGif.frames.forEach((frame) => {
    //     // Make each frame a centered square of size edgeLength x edgeLength.
    //     // Note that frames may vary in size and that reframe() works even if
    //     // the frame's image is smaller than the square. Should this happen,
    //     // the space surrounding the original image will be transparent.

    //     const xOffset = (frame.bitmap.width - edgeLength) / 2;
    //     const yOffset = (frame.bitmap.height - edgeLength) / 2;
    //     frame.reframe(xOffset, yOffset, edgeLength, edgeLength);
    //   });

    //   // The encoder determines GIF size from the frames, not the provided spec (sourceGif).
    //   return GifUtil.write("modified.gif", sourceGif.frames, sourceGif).then(
    //     (outputGif) => {
    //       console.log("modified");
    //     }
    //   );
    // });
  } else {
    const ext = path.extname(imgPath).toLowerCase();
    if (ext === ".webp") {
      console.warn("local webp image is not supported yet.");
    } else if (ext === ".gif") {
      let gif = await new Promise((resolve, reject) => {
        try {
          GifUtil.read(imgPath).then((gif) => {
            resolve(gif);
          });
        } catch (err) {
          reject(err);
        }
      });

      return gif;
    }
  }
}

export async function loadImage(imgPath: string, isDataUrl: boolean) {
  let img = null;

  if (isDataUrl) {
    img = new Image();
    img.src = imgPath;
    try {
      await img.decode();
    } catch {
      return null;
    }

    let canvas = <HTMLCanvasElement>document.createElement("canvas");
    let context = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
    let bitmap = context.getImageData(0, 0, img.width, img.height);

    return NativeImage.createFromBitmap(bitmap.data, {
      width: img.width,
      height: img.height,
    });
  } else {
    const ext = path.extname(imgPath).toLowerCase();
    if (ext === ".webp") {
      //img = await loadLocalWebp(imgPath);
      console.warn("local webp image is not supported yet.");
    } else {
      img = NativeImage.createFromPath(imgPath);
    }
  }
  return img;
}

// currently used for rgba buffer to electron.NativeImage input buffer
// TODO: better name for this
export function resolvePixelBuffer(
  width: number,
  height: number,
  bufferToResolve: Uint8Array
): Buffer {
  let buffer = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    buffer[idx + 0] = bufferToResolve[idx + 2]; // b
    buffer[idx + 1] = bufferToResolve[idx + 1]; // g
    buffer[idx + 2] = bufferToResolve[idx + 0]; // r
    buffer[idx + 3] = bufferToResolve[idx + 3]; // a
  }
  return Buffer.from(buffer);
}

export function toDataURL(width: number, height: number, rgba) {
  let buffer = resolvePixelBuffer(width, height, rgba);
  let nativeImg = NativeImage.createFromBuffer(buffer, {
    width: width,
    height: height,
  });
  return nativeImg.toDataURL();
}

// check target path is sub-directory of containerPath
export function isContainedBy(targetPath: string, containerPath: string) {
  const targetResolved = path.resolve(targetPath);
  const containerResolved = path.resolve(containerPath);

  // parent path must be shorter, so in this case there is no cotaining relation
  if (targetResolved.length < containerResolved.length) return false;

  let src = path.parse(targetResolved).dir;
  let parent = path.resolve(src, "..");
  let contained = src === containerResolved;
  while (src != parent) {
    src = parent;
    parent = path.resolve(src, "..");
    contained = src === containerResolved;
    if (contained) break;
  }
  return contained;
}

export function isInsideReservedPath(target: string) {
  // resource - tutorials, applications
  if (isContainedBy(target, RESOURCE_PATH)) return true;

  // subscribed item
  const workshopRoot = WorkshopManager.getInstance().WorkshopRoot;
  if (workshopRoot && isContainedBy(target, workshopRoot)) return true;

  return false;
}

const POTs: number[] = [
  1,
  2,
  4,
  8,
  16,
  32,
  64,
  128,
  256,
  512,
  1024,
  2048,
  4096,
];

export function UpdateTexture<T>(
  level: number,
  internalFormat: number,
  width: number,
  height: number,
  border: number,
  format: number,
  type: number,
  pixels: ArrayBufferView,
  nodetype: NodeType,
  gl: WebGL2RenderingContext,
  souldConvertChannel: boolean = false,
  shouldFlip: boolean = false
): WebGLTexture {
  let tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // bind a dummy texture to suppress WebGL warning.
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([255, 0, 255, 255])
  ); // red

  if (shouldFlip) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  } else {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  }

  if (souldConvertChannel) {
    // TODO: this should be fixed by using proper glAPI for texture format
    for (let i = 0; i < width * height; i++) {
      let pixelIdx = i * 4;
      [pixels[pixelIdx], pixels[pixelIdx + 2]] = [
        pixels[pixelIdx + 2],
        pixels[pixelIdx],
      ];
    }
  }

  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    format,
    type,
    pixels
  );

  const isPot = width === height && POTs.find((element) => element === width);
  if (isPot) {
    // set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  } else {
    // NPOT textures
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  gl.bindTexture(gl.TEXTURE_2D, null);

  return tex;
}

const latin: string[] = [
  "en",
  "es",
  "fr",
  "de",
  "tr",
  "pt-PT",
  "pt-BR",
  "pl",
  "cz",
  "no",
  "sv",
  "da",
  "nl",
];
const chineseSC: string[] = ["zh-CN"];
const chineseTC: string[] = ["zh-TW"];
const japanese: string[] = ["ja"];
const cyrillic: string[] = ["ru"];
const korean: string[] = ["kor"];

export function evaluateFontType(languageId: string): string {
  if (latin.findIndex((item) => item == languageId) != -1) {
    return "latin";
  }
  if (chineseSC.findIndex((item) => item == languageId) != -1) {
    return "chineseSC";
  }
  if (japanese.findIndex((item) => item == languageId) != -1) {
    return "japanese";
  }
  if (cyrillic.findIndex((item) => item == languageId) != -1) {
    return "cyrillic";
  }
  if (korean.findIndex((item) => item == languageId) != -1) {
    return "korean";
  }
  if (chineseTC.findIndex((item) => item == languageId) != -1) {
    return "chineseTC";
  }
}

function clampVal(number, min, max) {
  return Math.max(min, Math.min(number, max));
}

export function clamp(val: Vector2, min: Vector2, max: Vector2): Vector2 {
  let clamped = new Vector2(Vector2.ZERO);
  for (let i = 0; i < 2; i++) {
    clamped[i] = clampVal(val[i], min[i], max[i]);
  }
  return clamped;
}

export enum Easing {
  EaseIn_Sine = "EaseIn_Sine",
  EaseIn_Quad = "EaseIn_Quad",
  EaseIn_Cubic = "EaseIn_Cubic",
  EaseIn_Quart = "EaseIn_Quart",
  EaseIn_Quint = "EaseIn_Quint",
  EaseIn_Expo = "EaseIn_Expo",
  EaseOut_Sine = "EaseOut_Sine",
  EaseOut_Quad = "EaseOut_Quad",
  EaseOut_Cubic = "EaseOut_Cubic",
  EaseOut_Quart = "EaseOut_Quart",
  EaseOut_Quint = "EaseOut_Quint",
  EaseOut_Expo = "EaseOut_Expo",
  EaseInOut_Sine = "EaseInOut_Sine",
  EaseInOut_Quad = "EaseInOut_Quad",
  EaseInOut_Cubic = "EaseInOut_Cubic",
  EaseInOut_Quart = "EaseInOut_Quart",
  EaseInOut_Quint = "EaseInOut_Quint",
  EaseInOut_Expo = "EaseInOut_Expo",
  Linear = "Linear",
}

export const EASING_FUNCTIONS = new Map<Easing, Array<number>>([
  [Easing.EaseIn_Sine, [0.12, 0, 0.39, 0]],
  [Easing.EaseIn_Quad, [0.11, 0, 0.5, 0]],
  [Easing.EaseIn_Cubic, [0.32, 0, 0.67, 0]],
  [Easing.EaseIn_Quart, [0.5, 0, 0.75, 0]],
  [Easing.EaseIn_Quint, [0.64, 0, 0.78, 0]],
  [Easing.EaseIn_Expo, [0.7, 0, 0.84, 0]],
  [Easing.EaseOut_Sine, [0.61, 1, 0.88, 1]],
  [Easing.EaseOut_Quad, [0.5, 1, 0.89, 1]],
  [Easing.EaseOut_Cubic, [0.33, 1, 0.68, 1]],
  [Easing.EaseOut_Quart, [0.25, 1, 0.5, 1]],
  [Easing.EaseOut_Quint, [0.22, 1, 0.36, 1]],
  [Easing.EaseOut_Expo, [0.16, 1, 0.3, 1]],
  [Easing.EaseInOut_Sine, [0.37, 0, 0.63, 1]],
  [Easing.EaseInOut_Quad, [0.45, 0, 0.55, 1]],
  [Easing.EaseInOut_Cubic, [0.65, 0, 0.35, 1]],
  [Easing.EaseInOut_Quart, [0.76, 0, 0.24, 1]],
  [Easing.EaseInOut_Quint, [0.83, 0, 0.17, 1]],
  [Easing.EaseInOut_Expo, [0.87, 0, 0.13, 1]],
  [Easing.Linear, [0, 0, 1, 1]],
]);
