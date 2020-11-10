export const PREFIX = "--";
export const readProperty = function(name: string): string {
  const bodyStyles = window.getComputedStyle(document.body);

  const prop = bodyStyles.getPropertyValue(PREFIX + name);
  const offset = prop[0] === " " ? 1 : 0;
  // TODO: find a safer way to do this
  return prop.substring(offset);
};
