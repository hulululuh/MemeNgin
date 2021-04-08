//import settings from "electron-settings";
import { Color } from "custom-electron-titlebar";
import {
  readProperty,
  readPropertyAsColor,
  readPropertyAsNumber,
} from "./utils/scsshelper";

export class ApplicationSettings {
  colorPrimary: string = "#21252b";
  colorSecondary: string = "#282c34";
  colorBorder: string = "#3e4146";
  colorAccent1: string = "#d52015";
  colorAccent2: string = "#2196f3";
  colorAccent3: string = "#4caf50";
  colorFont: string = "#f8f4f4";
  colorGridBackground: string;
  colorGridPrimary: string;
  colorGridSecondary: string;
  colorFocused: string = "#0095ff";
  colorEditorText: string = "#000000ff";
  colorInputsStroke: string = "#333333ff";
  colorInputsFill: string = "#ffffffff";

  lineWidthNormal: number = 2;
  lineWidthThick: number = 3;

  widgetRadius: number = 7;
  colThicknessLine: number = 10;
  colThicknessCircle: number = 3;

  colorWidget: string = "#ffffff";
  colorWidgetHighlight: string = "#3282b8";
  colorWidgetShadow: string = "#1e1e1e";
  colorSelectedItem: string = "#bbe1fa";
  colorSelectedItemBackground: string = "#3282b84c";
  colorSocketTitle: string = "#222222ff";
  colorConnectionLine: string = "#1e1e1eff";
  colorTitle: Color = Color.fromHex("#3c3c3c");

  widgetThickness: number = 3.0;
  widgetShadowThickness: number = 2.0;

  // for lazy loading after scss available
  load() {
    this.colorWidget = readProperty("colorWidget");
    this.colorWidgetHighlight = readProperty("colorWidgetHighlight");
    this.colorWidgetShadow = readProperty("colorWidgetShadow");
    this.colorSelectedItem = readProperty("colorSelectedItem");
    this.colorSelectedItemBackground = readProperty(
      "colorSelectedItemBackground"
    );
    this.colorGridBackground = readProperty("colorGridBackground");
    this.colorGridPrimary = readProperty("colorGridPrimary");
    this.colorGridSecondary = readProperty("colorGridSecondary");
    this.colorFocused = readProperty("colorFocused");
    this.colorEditorText = readProperty("colorEditorText");
    this.colorInputsStroke = readProperty("colorInputsStroke");
    this.colorInputsFill = readProperty("colorInputsFill");

    this.colorSocketTitle = readProperty("colorSocketTitle");
    this.colorConnectionLine = readProperty("colorConnectionLine");
    this.widgetThickness = readPropertyAsNumber("widgetThickness");
    this.widgetShadowThickness = readPropertyAsNumber("widgetShadowThickness");
    this.colorTitle = readPropertyAsColor("colorTitle");
  }

  static _instance: ApplicationSettings;
  static getInstance(): ApplicationSettings {
    if (!ApplicationSettings._instance) {
      ApplicationSettings._instance = new ApplicationSettings();
    }
    return ApplicationSettings._instance;
  }
}
