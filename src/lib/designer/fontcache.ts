import opentype from "opentype.js";
import hash from "object-hash";
import path from "path";

import { remote } from "electron";
import { Dictionary } from "dictionary-types";
import { promises } from "fs";

// const fontUrl =
//   "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf";

async function loadFont(url): Promise<any> {
  return await new Promise((resolve, reject) =>
    opentype.load(url, (err, font) => (err ? reject(err) : resolve(font)))
  );
}

export class FontCache {
  private static _instance: FontCache = new FontCache();
  private _fonts: Dictionary<any> = {};

  private _fallbackFont: any;

  constructor() {
    const fontPath = path.join(
      remote.app.getAppPath() + "/../src/assets/fonts/Roboto/Roboto-Regular.ttf"
    );

    let self = this;
    opentype.load(fontPath, function(err, font) {
      if (err) {
        alert("Font could not be loaded: " + err);
      } else {
        self._fallbackFont = font;
      }
    });
  }

  static getInstance() {
    if (!FontCache._instance) {
      FontCache._instance = new FontCache();
    }
    return FontCache._instance;
  }

  get fallbackFont() {
    return this._fallbackFont;
  }

  async getFont(fontUrl: string): Promise<any> {
    const key = hash(fontUrl);
    let retFont;
    // use if font exits on the cache
    if (this._fonts[key]) {
      return this._fonts[key];
    } else {
      let font = await loadFont(fontUrl);
      if (font) {
        this._fonts[key] = font;
        return this._fonts[key];
      } else {
        return this._fallbackFont;
      }
    }
  }
}
