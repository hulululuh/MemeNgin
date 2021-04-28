import {
  GraphicsItem,
  MouseDownEvent,
  MouseMoveEvent,
  MouseUpEvent,
} from "./graphicsitem";
import { SceneView } from "./view";
import { Vector2 } from "@math.gl/core";
import { Color } from "../designer/color";
import {
  IPropertyHolder,
  Property,
  StringProperty,
} from "../designer/properties";
import { MoveItemsAction } from "../actions/moveItemsaction";
import { UndoStack } from "../undostack";
import { ApplicationSettings } from "@/settings";
import { TextManager } from "@/assets/textmanager";
const settings = ApplicationSettings.getInstance();

// https://stackoverflow.com/questions/5026961/html5-canvas-ctx-filltext-wont-do-line-breaks
export class CommentGraphicsItem extends GraphicsItem
  implements IPropertyHolder {
  text: string;
  formatted: string;
  textProp: StringProperty;
  view: SceneView;
  color: Color;
  strokeColor: Color;
  textColor: Color;

  padding: number;
  fontHeight: number;

  hit: boolean;
  dragged: boolean;
  dragStartPos: Vector2;

  constructor(view: SceneView) {
    super();
    this.text = "";
    this.view = view;
    this.color = Color.parse(settings.colorInputsFill);
    this.strokeColor = Color.parse(settings.colorInputsStroke);
    this.textColor = Color.parse(settings.colorEditorText);

    this.hit = false;
    this.dragged = false;

    this.padding = 5;
    this.fontHeight = 15;

    this.textProp = new StringProperty("comment", "Comment", "Comment.", true);
    this.properties.push(this.textProp);

    this.setText("comment");
  }

  properties: Property[] = new Array();
  setProperty(name: string, value: any) {
    let prop = this.properties.find((x) => {
      return x.name == name;
    });

    // if (prop) {
    // 	prop.setValue(value);
    // }

    if (name == "comment") {
      this.setText(value.value);
    }
  }

  setText(text: string) {
    this.text = text;
    let translated = TextManager.translate(this.text);
    this.formatted = translated.replace(/(.{60})/g, "$1\n");

    this.textProp.setValue(text);
    let fontHeight = this.fontHeight;

    let ctx = this.view.context;

    ctx.lineWidth = 1;
    ctx.font = fontHeight + "px 'Open Sans'";

    let maxWidth = 0;
    let lines = this.formatted.split("\n");
    // console.log(lines);
    // console.log(ctx);
    // console.log(ctx.font);
    for (let i = 0; i < lines.length; ++i) {
      let size = ctx.measureText(lines[i]);
      //console.log("INITIAL WITH: " + size.width);
      maxWidth = Math.max(maxWidth, size.width);
    }

    // somewhat inaccurate here for some reason
    // maybe some bug in html5 canvas
    // recalculate in draw function
    this.width = maxWidth + this.padding * 2;
    this.height = lines.length * fontHeight + this.padding * 2;
  }

  private buildColor(color: Color, alpha: number) {
    let col =
      "rgba(" +
      color.r * 255 +
      "," +
      color.g * 255 +
      "," +
      color.b * 255 +
      "," +
      alpha +
      ")";

    return col;
  }

  draw(ctx: CanvasRenderingContext2D, renderData: any = null) {
    let fontHeight = this.fontHeight;
    ctx.font = fontHeight + "px 'Open Sans'";
    ctx.fillStyle = "rgb(240, 240, 240)";

    // recalc rect
    let maxWidth = 0;
    //console.log(this.text);
    let lines = this.formatted.split("\n");
    for (let i = 0; i < lines.length; ++i) {
      let size = ctx.measureText(lines[i]);
      maxWidth = Math.max(maxWidth, size.width);
    }

    this.width = maxWidth + this.padding * 2;
    this.height = lines.length * fontHeight + this.padding * 2;

    // --------------------------------------------------------

    let width = this.width;
    let height = this.height;

    // stroke bounding rect
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.buildColor(this.strokeColor, 0.7);
    this.roundRect(ctx, this.x, this.y, width, height, 1);
    ctx.stroke();

    // inner area
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.fillStyle = this.buildColor(this.color, 0.1);
    this.roundRect(ctx, this.x, this.y, width, height, 1);
    ctx.fill();

    // multiline text
    ctx.fillStyle = this.buildColor(this.textColor, 1.0);
    let textX = this.x + this.padding;
    let textY = this.y + fontHeight;

    let lineHeight = fontHeight;
    //let lines = this.text.split("\n");
    ctx.font = fontHeight + "px 'Open Sans'";
    ctx.textAlign = "left";
    ctx.lineWidth = 1;

    //console.log(ctx.font);
    for (let i = 0; i < lines.length; ++i) {
      ctx.fillText(lines[i], textX, textY);
      textY += lineHeight;
      let size = ctx.measureText(lines[i]);
      //console.log("RENDER WITH: " + size.width);
    }
  }

  // MOUSE EVENTS
  mouseDown(evt: MouseDownEvent) {
    this.hit = true;
    this.dragged = false;
    this.dragStartPos = new Vector2(this.x, this.y);
    //console.log(this.text);
  }

  mouseMove(evt: MouseMoveEvent) {
    if (this.hit) {
      // movement
      this.move(evt.deltaX, evt.deltaY);
      this.dragged = true;
    }
  }

  mouseUp(evt: MouseUpEvent) {
    this.hit = false;

    // add undo/redo
    let newPos = new Vector2(this.x, this.y);

    if (this.dragged) {
      let action = new MoveItemsAction(
        [this],
        [this.dragStartPos.clone()],
        [newPos]
      );

      UndoStack.current.push(action);
    }

    this.dragged = false;
  }
}
