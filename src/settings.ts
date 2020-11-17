//import settings from "electron-settings";

export class ApplicationSettings {
  colorPrimary: string = "#21252b";
  colorSecondary: string = "#282c34";
  colorBorder: string = "#3e4146";
  colorAccent1: string = "#d52015";
  colorAccent2: string = "#2196f3";
  colorAccent3: string = "#4caf50";
  colorFont: string = "#f8f4f4";

  lineWidthNormal: number = 2;
  lineWidthThick: number = 3;

  widgetRadius: number = 7;
  colThicknessLine: number = 10;
  colThicknessCircle: number = 3;

  static _instance: ApplicationSettings;
  static getInstance(): ApplicationSettings {
    if (!ApplicationSettings._instance) {
      ApplicationSettings._instance = new ApplicationSettings();
    }
    return ApplicationSettings._instance;
  }
}
