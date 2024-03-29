// [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

import fs from "fs";
import path from "path";
import { Guid, evaluateFontType } from "@/lib/utils";
import {
  TextGeometry,
  TextAlign,
  TextAlignVertical,
} from "@/lib/geometry/textGeometry";
import { Editor } from "@/lib/editor";
import { NodeType } from "@/lib/designer/designernode";
import { Color } from "@/lib/designer/color";
import { UpdateTexture } from "@/lib/utils";
import { buildShaderProgram } from "@/lib/designer/gl";
import { UserData } from "@/userdata";
import getSystemFonts from "get-system-fonts";
import { LOCAL_FONT_PATH } from "@/lib/utils";
const electron = require("electron");

declare let __static: any;

function isFilteredResultOf(fileName, filter) {
  const filePath = path.parse(fileName);
  const name = filePath.name;
  const ext = filePath.ext;

  const filterPath = path.parse(filter);
  const fName = filterPath.name;
  const fExt = filterPath.ext;

  // exact
  let namePass = false;
  let extPass = false;
  if (fName === "*") {
    namePass = true;
  } else if (fName === name) {
    namePass = true;
  }

  if (fExt !== ".*") {
    extPass = true;
  } else if (fExt === ext) {
    extPass = true;
  }

  return namePass && extPass;
}

export function getAllFiles(dirPath, arrayOfFiles, filter) {
  let files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles, filter);
    } else if (isFilteredResultOf(file, filter)) {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });

  return arrayOfFiles;
}

export enum AssetType {
  Font = "font",
  Lut = "lut",
  Icon = "icon",
}

export const ASSET_FOLDER = new Map([
  [AssetType.Font, "fonts"],
  [AssetType.Lut, "luts"],
  [AssetType.Icon, "nodes"],
]);

export class Asset {
  id!: any;
  name: string;
  nickname?: string;
  path: string;
  icon: string;
  type: AssetType;
  protected _assetPath: string;
  protected _isReady;

  init(
    id: string,
    name: string,
    path: string,
    icon: string,
    type: string,
    nickname: string
  ) {
    this.id = id;
    this.name = name;
    this.nickname = nickname;
    this.path = path;
    this.icon = icon;
    const t = type as AssetType;

    if (t) {
      this.type = type as AssetType;
    }

    if (!this.isValid()) {
      this.build();
    }
  }

  isValid() {
    return (
      this.id !== 0 &&
      this.id !== null &&
      fs.existsSync(path.join(__static, this.iconPath))
    );
  }

  isLoaded() {
    return false;
  }

  async build() {
    console.log(`Building Asset ${this.name}`);
    if (this.id === 0) {
      this.id = Guid.newGuid();
    }

    // save asset.json
    const jsonPath = path.join(__static, this._assetPath, "asset.json");

    let json = JSON.stringify(this, null, 4);
    fs.writeFileSync(jsonPath, json);

    const iconPath = path.join(__static, this.iconPath);
    if (!fs.existsSync(iconPath)) {
      try {
        let iconCreated = await this.buildIcon();
        if (!iconCreated) return;
      } catch (err) {
        console.log(err);
        return;
      }
    }
  }

  load() {}

  async buildIcon(): Promise<boolean> {
    return Promise.resolve(false);
  }

  get iconPath(): string {
    return path.join(this._assetPath, this.icon);
  }

  get assetPath(): string {
    return path.join(this._assetPath, this.path);
  }
}

const fontWidth = 512;
const fontHeight = 128;

function createImageFromTexture(gl, texture, width, height) {
  // Create a framebuffer backed by the texture
  let framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );

  // Read the contents of the framebuffer
  let data = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.deleteFramebuffer(framebuffer);

  // Create a 2D canvas to store the result
  let canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  let context = canvas.getContext("2d");

  // Copy the pixels to a 2D canvas
  let imageData = context.createImageData(width, height);
  imageData.data.set(data);
  context.putImageData(imageData, 0, 0);
  context.translate(width, 0);
  context.scale(1, -1);
  //context.drawImage(imageData, 0, 0);

  let img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

export class FontAsset extends Asset {
  async buildIcon(): Promise<any> {
    const iconPath = path.join(__static, this.iconPath);
    const name = this.nickname.length > 0 ? this.nickname : this.name;

    let [height, alignVert] = [fontHeight * 0.7, TextAlignVertical.Center];

    const isJP = true;
    if (isJP) {
      [height, alignVert] = [fontHeight * 0.6, TextAlignVertical.Top];
    }
    let textGeom = new TextGeometry(
      name,
      this.id,
      height,
      false,
      false,
      1,
      0,
      1.5,
      TextAlign.Left,
      alignVert
    );

    textGeom.onFontChanged = () => {
      textGeom.makeFontGeometry();

      if (!textGeom || !textGeom.vertices || !textGeom.indices) {
        console.error(`Failed to build icon of font : ${this.name}`);
        return Promise.reject();
      }

      const gl = Editor.getDesigner().gl;

      let vertSource = `
        precision mediump float;
        uniform vec2 uScale;
        uniform vec2 uOffset;
        attribute vec2 position;
        void main() {
          vec2 pos = position;
          gl_Position = vec4(pos * uScale + uOffset, 0.0, 1.0);
        }`;

      let fragSource = `
        precision mediump float;
        uniform vec4 uColor;
        void main() {
          gl_FragColor = uColor;
        }`;

      const shaderProgram = buildShaderProgram(gl, vertSource, fragSource);
      const fbo = gl.createFramebuffer();

      const baseTex = UpdateTexture(
        0,
        gl.RGBA,
        fontWidth,
        fontHeight,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
        NodeType.Procedural,
        gl
      );

      // bind a text framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.activeTexture(gl.TEXTURE0);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        baseTex,
        0
      );

      const color = new Color(0.0, 0.0, 0.0);
      const width = fontWidth;
      const height = fontHeight;

      gl.viewport(0, 0, width, height);

      Editor.getDesigner().setTextureSize(width, height);

      const [uScale, uOffset, uColor] = [
        "uScale",
        "uOffset",
        "uColor",
      ].map((name) => gl.getUniformLocation(shaderProgram, name));
      gl.useProgram(shaderProgram);
      gl.uniform2fv(uScale, [2.0 / width, -2.0 / height]);

      gl.uniform2fv(uOffset, [-1.0, -1.0]);
      gl.uniform4fv(uColor, [color.r, color.g, color.b, color.a]);

      gl.clearColor(color.r, color.g, color.b, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const vertBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, textGeom.vertices, gl.STATIC_DRAW);
      const indxBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indxBuffer);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        textGeom.indicesData,
        gl.STATIC_DRAW
      );

      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, true, 8, 0);

      gl.disable(gl.CULL_FACE);
      gl.drawElements(
        gl.TRIANGLES,
        textGeom.indices.length,
        gl.UNSIGNED_INT,
        0
      );

      gl.enable(gl.CULL_FACE);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      let img = createImageFromTexture(gl, baseTex, width, height);
      const nativeImage = electron.nativeImage.createFromDataURL(img.src);
      const buffer = nativeImage.toPNG();

      try {
        fs.writeFileSync(iconPath, buffer);
      } catch (err) {
        alert("Error saving image: " + err);
        return Promise.reject();
      }

      return Promise.resolve(true);
    };
  }
}

export class LutAsset extends Asset {
  async build(): Promise<any> {
    // skip this until it is implemented
  }
  async buildIcon(): Promise<any> {
    Promise.resolve(false);
  }
}

export class IconAsset extends Asset {}

export class AssetFactory {
  name: string;
  create: () => Asset;
}

export class AssetManager {
  private static _instance: AssetManager = new AssetManager();
  assets: Map<string, Map<string, Asset>>;
  factories: Map<string, any>;
  static systemFonts: Array<string> = null;

  addFactory<T extends Asset>(name, type: { new (): T }) {
    let factory = new AssetFactory();
    factory.name = name;
    factory.create = (): Asset => {
      return new type();
    };

    this.factories.set(name, factory);
  }

  static getInstance() {
    if (!AssetManager._instance) {
      AssetManager._instance = new AssetManager();
    }
    return AssetManager._instance;
  }

  constructor() {
    this.assets = new Map<string, any>();
    this.factories = new Map<string, any>();
    for (const value of Object.values(AssetType)) {
      this.assets.set(value, new Map<string, any>());
    }

    if (!AssetManager.systemFonts) {
      AssetManager.listSystemFonts();
    }

    this.addFactory("font", FontAsset);
    this.addFactory("lut", LutAsset);
    this.addFactory("icon", IconAsset);

    UserData.serialize();
    this.initialize();
  }

  static async listSystemFonts() {
    AssetManager.systemFonts = await new Promise((resolve) => {
      resolve(getSystemFonts({ additionalFolders: [LOCAL_FONT_PATH] }));
    });
  }

  async initialize() {
    let assetFiles = [];
    for (const value of Object.values(AssetType)) {
      const assetRoot = "assets/" + ASSET_FOLDER.get(value as AssetType) + "/";
      const assetPath = path.join(__static, assetRoot);
      if (value == AssetType.Font) {
        const id = UserData.getInstance().languageId;
        const fontType: string = evaluateFontType(id);

        // locale
        if (fontType != "latin") {
          const fontsLocalePath = path.join(assetPath, fontType);
          getAllFiles(fontsLocalePath, assetFiles, "asset.json");
        }

        // plus latin
        const fontsLatinPath = path.join(assetPath, "latin");
        getAllFiles(fontsLatinPath, assetFiles, "asset.json");
      } else {
        getAllFiles(assetPath, assetFiles, "asset.json");
      }
    }

    let self = this;
    for (const assetFile of assetFiles) {
      const relPath = path.relative(__static, assetFile);
      let asset = await this.create(relPath);
      if (asset) self.assets.get(asset.type).set(asset.id, asset);
    }
    console.log(this.assets);
  }

  async findForeignFont(fontId: string) {
    let assetFiles = [];
    const assetRoot = "assets/" + ASSET_FOLDER.get(AssetType.Font) + "/";
    const assetPath = path.join(__static, assetRoot);
    getAllFiles(assetPath, assetFiles, "asset.json");

    for (const assetFile of assetFiles) {
      const relPath = path.relative(__static, assetFile);
      let asset: Asset = await new Promise((resolve) => {
        resolve(this.create(relPath));
      });

      if (asset) {
        let existed = this.assets.get(AssetType.Font).get(asset.id);
        if (existed) continue;
        if (fontId == asset.id) {
          this.assets.get(AssetType.Font).set(asset.id, asset);
          return asset;
        }
      }
    }

    return null;
  }

  //create(json: any) {
  async create(jsonPath: any) {
    let json: any = await new Promise((resolve) => {
      fetch(jsonPath).then((res) => {
        res.json().then((json) => {
          resolve(json);
        });
      });
    });

    const factoryName = json.type;
    if (!this.factories.has(factoryName)) {
      console.error(`we are not supporting asset ${factoryName} yet.`);
      return null;
    }

    let asset = this.factories.get(factoryName).create();
    asset._assetPath = path.parse(jsonPath).dir;
    asset.init(
      json.id,
      json.name,
      json.path,
      json.icon,
      json.type as AssetType,
      json.nickname ? json.nickname : ""
    );
    return asset;
  }

  get fontIds(): string[] {
    return [
      ...this.assets.get(AssetType.Font).keys(),
      ...AssetManager.systemFonts,
    ];
  }

  getAssetLists(type: AssetType) {
    let list = this.assets.get(type);
    let idList = [];
    for (const key of list.keys()) {
      idList.push(key);
    }
    return idList;
  }

  getAssetById(id: string, type?: AssetType) {
    if (type) {
      return this.assets.get(type).get(id);
    } else {
      for (let key of this.assets.keys()) {
        let assetOfType = this.assets.get(key);
        if (assetOfType.has(id)) return assetOfType.get(id);
      }
    }

    console.log("no item found");
    return null;
  }

  // we do this because font's local path can be different from each devices
  getSystemFontPathById(id: string): string {
    let val = AssetManager.systemFonts.find(
      (item) => path.parse(item).name == path.parse(id).name
    );

    return val ? val : "";
  }
}
