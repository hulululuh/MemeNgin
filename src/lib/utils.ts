// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import path from "path";
const NativeImage = require("electron").nativeImage;

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
