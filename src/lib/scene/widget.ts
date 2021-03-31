import { WidgetEvent } from "@/lib/scene/graphicsitem";

export enum WidgetType {
  None = "none",
  Transform2D = "transform2d",
  TransformQuad = "transformquad",
}

export interface iWidget {
  // typeguard
  member: string;

  // property
  isEnabled(): boolean;
  isPointInside(px: number, py: number): boolean;

  // functions
  draw(ctx: CanvasRenderingContext2D, renderData: any): void;
  setEnable(enable: boolean): void;

  // callbacks
  onWidgetUpdated(evt: WidgetEvent): void;
}

export function implementsWidget(object: any): object is iWidget {
  return "member" in object;
}
