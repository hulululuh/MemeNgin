import { Color } from "custom-electron-titlebar";

export const PREFIX = "--";
export const readProperty = function(name: string): string {
  const bodyStyles = window.getComputedStyle(document.body);

  const prop = bodyStyles.getPropertyValue(PREFIX + name);
  const offset = prop[0] === " " ? 1 : 0;
  // TODO: find a safer way to do this
  return prop.substring(offset);
};

export const readPropertyAsNumber = function(name: string): number {
  return parseFloat(readProperty(name));
};

export const readPropertyAsColor = function(name: string): Color {
  return Color.fromHex(readProperty(name));
};

export const readPropertyAsBoolean = function(name: string): boolean {
  return parseInt(readProperty(name)) == 1 ? true : false;
};
