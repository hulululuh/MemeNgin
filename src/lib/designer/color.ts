// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

// values range from 0 to 1
export class Color {
  r: number = 0.0;
  g: number = 0.0;
  b: number = 0.0;
  a: number = 1.0;

  constructor(
    r: number = 0.0,
    g: number = 0.0,
    b: number = 0.0,
    a: number = 1.0
  ) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  clone(): Color {
    return new Color(this.r, this.g, this.b, this.a);
  }

  copy(col: Color) {
    this.r = col.r;
    this.g = col.g;
    this.b = col.b;
    this.a = col.a;
  }

  lerp(to: Color, t: number) {
    this.r = this.r * t + to.r * (1.0 - t);
    this.g = this.g * t + to.g * (1.0 - t);
    this.b = this.b * t + to.b * (1.0 - t);
    this.a = this.a * t + to.a * (1.0 - t);
  }

  static parse(hex: string): Color {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
      hex
    );
    if (result) {
      let c = new Color();
      c.r = parseInt(result[1], 16) / 255;
      c.g = parseInt(result[2], 16) / 255;
      c.b = parseInt(result[3], 16) / 255;
      c.a = result[4].length == 0 ? 1.0 : parseInt(result[4], 16) / 255;
      return c;
    } else {
      return new Color();
    }
  }

  toHex(): string {
    // forcing return value to '8' hex number, otherwise alpha value handling become quite messed up.
    let hex =
      "#" +
      ("00" + Math.round(this.r * 255.0).toString(16)).slice(-2) +
      ("00" + Math.round(this.g * 255.0).toString(16)).slice(-2) +
      ("00" + Math.round(this.b * 255.0).toString(16)).slice(-2) +
      ("00" + Math.round(this.a * 255.0).toString(16)).slice(-2);

    return hex;
  }
}
