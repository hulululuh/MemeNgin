import { SocketGraphicsItem, SocketInOut } from "./socketgraphicsitem";
import { GraphicsItem } from "./graphicsitem";
import { ApplicationSettings } from "@/settings";

const settings = ApplicationSettings.getInstance();

export class ConnectionGraphicsItem extends GraphicsItem {
  id!: string;
  socketA!: SocketGraphicsItem;
  socketB!: SocketGraphicsItem;

  get inNode() {
    return this.socketA.socketInOut == SocketInOut.In
      ? this.socketA.node
      : this.socketB.node;
  }

  get outNode() {
    return this.socketA.socketInOut == SocketInOut.Out
      ? this.socketA.node
      : this.socketB.node;
  }

  draw(ctx: CanvasRenderingContext2D, renderData: any = null) {
    ctx.beginPath();
    ctx.strokeStyle = settings.colorConnectionLine;
    ctx.lineWidth = 4;
    ctx.moveTo(this.socketA.centerX(), this.socketA.centerY());
    ctx.bezierCurveTo(
      this.socketA.centerX() + 60,
      this.socketA.centerY(), // control point 1
      this.socketB.centerX() - 60,
      this.socketB.centerY(),
      this.socketB.centerX(),
      this.socketB.centerY()
    );
    ctx.stroke();
  }
}
