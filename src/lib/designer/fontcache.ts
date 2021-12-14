// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import opentype from "opentype.js";
import hash from "object-hash";
import path from "path";
import { Dictionary } from "dictionary-types";
import {
  AssetManager,
  AssetType,
  ASSET_FOLDER,
  getAllFiles,
} from "@/assets/assetmanager";
import getSystemFonts from "get-system-fonts";
import { LOCAL_FONT_PATH } from "@/lib/utils";

const fontPath = "assets/fonts/fallback/NotoSansCJKjp-Regular.otf";
export let SystemFonts = null;

export function CalcFontPath(pathToFont: string) {
  //return `./assets/nodes/${node}.png`;
  if (process.env.NODE_ENV == "production")
    return "file://" + path.join(process.env.BASE_URL, pathToFont);
  return path.join(process.env.BASE_URL, pathToFont);
}

async function loadFont(url): Promise<any> {
  return await new Promise((resolve, reject) =>
    opentype.load(url, (err, font) => {
      if (err) {
        alert(
          `Your font is too powerful for MemeNgin to handle. please try similar fonts :( \n - ${err}`
        );
      } else {
        resolve(font);
      }
    })
  );
}

export class FontCache {
  private static _instance: FontCache = new FontCache();
  private _fonts: Dictionary<any> = {};
  private _fallbackFont: any;
  static systemFonts: Array<string> = null;

  constructor() {
    if (!FontCache.systemFonts) {
      FontCache.listSystemFonts();
    }

    let self = this;
    opentype.load(fontPath, function(err, font) {
      if (err) {
        alert(
          `Your font is too powerful for MemeNgin to handle. please try similar fonts :( \n [error] ${err}`
        );
      } else {
        self._fallbackFont = font;
      }
    });
  }

  static async listSystemFonts() {
    FontCache.systemFonts = await new Promise((resolve) => {
      resolve(getSystemFonts({ additionalFolders: [LOCAL_FONT_PATH] }));
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

  async getFontById(id: string): Promise<any> {
    // abort, if invalid id is given
    if (!id) return;

    const fonts = AssetManager.getInstance().assets.get(AssetType.Font);
    let fontAsset = fonts.get(id);

    // if requested font not found in current locale, then user probably viewing other languages.
    if (!fontAsset) {
      fontAsset = await AssetManager.getInstance().findForeignFont(id);
    }

    // not foreign font? then it might be a system font
    let fontUrl = id;
    if (fontAsset) fontUrl = fontAsset.assetPath;
    const key = id;

    // use if font exits on the cache
    if (this._fonts[key]) {
      return this._fonts[key];
    } else {
      try {
        let font = await loadFont(fontUrl);
        if (font) {
          this._fonts[key] = font;
          return this._fonts[key];
        } else {
          return this._fallbackFont;
        }
      } catch {
        return this._fallbackFont;
      }
    }
  }

  async getFont(fontUrl: string): Promise<any> {
    const key = hash(fontUrl);

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
