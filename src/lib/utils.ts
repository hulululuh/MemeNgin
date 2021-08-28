// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import path from "path";
import { WorkshopManager } from "@/community/workshop";
import { NodeType } from "@/lib/designer/designernode";
import { Vector2 } from "@math.gl/core";
const NativeImage = require("electron").nativeImage;

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
  EaseIn_Cubic,
  EaseOut_Cubic,
  EaseInOut_Cubic,
  EaseIn_Expo,
  EaseOut_Expo,
  EaseInOut_Expo,
  Linear,
}

export const EASING_FUNCTIONS = new Map<Easing, Array<number>>([
  [Easing.EaseIn_Cubic, [0.32, 0, 0.67, 0]],
  [Easing.EaseOut_Cubic, [0.33, 1, 0.68, 1]],
  [Easing.EaseInOut_Cubic, [0.65, 0, 0.35, 1]],
  [Easing.EaseIn_Expo, [0.7, 0, 0.84, 0]],
  [Easing.EaseOut_Expo, [0.16, 1, 0.3, 1]],
  [Easing.EaseInOut_Expo, [0.87, 0, 0.13, 1]],
  [Easing.Linear, [0, 0, 1, 1]],
]);
