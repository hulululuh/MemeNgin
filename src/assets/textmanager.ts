// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import { UserData } from "@/userdata";
import fs from "fs";
import path from "path";
import YAML from "yaml";

// referenced from shapez.io https://github.com/tobspr/shapez.io
/**
 * @type {Object<string, {name: string, data: any, code: string, region: string}>}
 */
export const LANGUAGES = {
  "en": {
    name: "English",
    data: "assets/translations/text-en.yaml",
    code: "en",
    region: "us",
  },
  "es-419": {
    name: "Español",
    data: "assets/translations/text-es.yaml",
    code: "es",
    region: "es",
  },
  "kor": {
    name: "한국어",
    data: "assets/translations/text-kor.yaml",
    code: "kor",
    region: "kr",
  },
  "ja": {
    name: "日本語",
    data: "assets/translations/text-ja.yaml",
    code: "ja",
    region: "jpn",
  },
  "zh-CN": {
    // simplified
    name: "中文简体",
    data: "assets/translations/text-zh-CN.yaml",
    code: "zh",
    region: "CN",
  },
  "zh-TW": {
    // traditional
    name: "中文繁體",
    data: "assets/translations/text-zh-TW.yaml",
    code: "zh",
    region: "TW",
  },
  "fr": {
    name: "Français",
    data: "assets/translations/text-fr.yaml",
    code: "fr",
    region: "fra",
  },
  "de": {
    name: "Deutsch",
    data: "assets/translations/text-de.yaml",
    code: "de",
    region: "deu",
  },
  "ru": {
    name: "Русский",
    data: "assets/translations/text-ru.yaml",
    code: "ru",
    region: "rus",
  },
  "tr": {
    name: "Türkçe",
    data: "assets/translations/text-tr.yaml",
    code: "tr",
    region: "tur",
  },
  "pt-PT": {
    name: "Português (Portugal)",
    data: "assets/translations/text-pt-PT.yaml",
    code: "pt",
    region: "PT",
  },
  "pt-BR": {
    name: "Português (Brasil)",
    data: "assets/translations/text-pt-BR.yaml",
    code: "pt",
    region: "BR",
  },
  "pl": {
    name: "Polski",
    data: "assets/translations/text-pl.yaml",
    code: "pl",
    region: "pol",
  },
  "cs": {
    name: "Čeština",
    data: "assets/translations/text-cs.yaml",
    code: "cs",
    region: "cze",
  },
  "no": {
    name: "Norsk",
    data: "assets/translations/text-no.yaml",
    code: "no",
    region: "nor",
  },
  "sv": {
    name: "Svenska",
    data: "assets/translations/text-sv.yaml",
    code: "sv",
    region: "swe",
  },
  "da": {
    name: "Dansk",
    data: "assets/translations/text-da.yaml",
    code: "da",
    region: "dnk",
  },
  "nl": {
    name: "Nederlands",
    data: "assets/translations/text-nl.yaml",
    code: "nl",
    region: "nld",
  },
};

declare let __static: any;

const deepValue = (obj, path) =>
  path.split(".").reduce((p, c) => (p && p[c]) || null, obj);

export class TextManager {
  private static _instance: TextManager = new TextManager();
  languageId: string = "en";
  parsed: any;
  parsedFallback: any;

  static getInstance() {
    if (!TextManager._instance) {
      TextManager._instance = new TextManager();
    }
    return TextManager._instance;
  }

  static translate(text: string) {
    let translated = text.replace(/\${(.*?)}/g, (x, g) =>
      deepValue(this.getInstance().parsed, g)
    );

    // if translation of requested key is not available, then get value in fallback
    if (translated == "null") {
      translated = text.replace(/\${(.*?)}/g, (x, g) =>
        deepValue(this.getInstance().parsedFallback, g)
      );
    }
    return translated;
  }

  constructor() {
    this.parsedFallback = this.parseLanguage("en");
  }

  parseLanguage(languageId: string) {
    let metadata = LANGUAGES[languageId];
    let tsPath = path.join(__static, metadata.data);
    if (!fs.existsSync(tsPath)) {
      console.log(`couldn't find ${languageId}`);
      return null;
    }

    const file = fs.readFileSync(tsPath, "utf8");
    return YAML.parse(file);
  }

  setLanguage(languageId: string) {
    this.languageId = languageId;
    this.parsed = this.parseLanguage(this.languageId);
    UserData.getInstance().languageId = this.languageId;
  }
}
