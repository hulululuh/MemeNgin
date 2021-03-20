import { Transform2D } from "../math/transform2d";
import { Color } from "./color";
import { Gradient } from "./gradient";
import { Vector2 } from "math.gl";
import { Asset, AssetType } from "@/assets/assetmanager";

// for use in code after build
export enum PropertyType {
  Float = "float",
  Int = "int",
  Bool = "bool",
  Color = "color",
  Enum = "enum",
  String = "string",
  Gradient = "gradient",
  File = "file",
  Transform2D = "transform2d",
  Asset = "asset",

  // use it on the socket
  Image = "image",
}

export class Property {
  name: string;
  displayName: string;
  type: string;
  exposed: boolean;
  parentValue: any;

  constructor() {
    this.exposed = false;
  }

  getParentValue(): any {
    return this.parentValue;
  }

  // to be overriden
  getValue(): any {
    return null;
  }

  setValue(val: any) {}

  clone(): Property {
    return null;
  }

  getExposed() {
    return this.exposed;
  }

  setExposed(val: boolean) {
    this.exposed = val;
  }
}

export interface IPropertyHolder {
  properties: Property[];
  setProperty(name: string, value: any);
  onnodepropertychanged?: (prop: Property) => void;
  onnodeexposechanged?: (prop: Property) => void;
}

export class FloatProperty extends Property {
  value: number;
  minValue: number = 0;
  maxValue: number = 1;
  step: number = 1;
  constructor(
    name: string,
    displayName: string,
    value: number,
    step: number = 1
  ) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.value = value;
    this.parentValue = value;
    this.step = step;
    this.type = PropertyType.Float;
  }

  getValue(): any {
    return this.value;
  }

  setValue(val: any) {
    // todo: validate
    this.value = val;
  }

  clone(): Property {
    let prop = new FloatProperty(
      this.name,
      this.displayName,
      this.value,
      this.step
    );
    prop.minValue = this.minValue;
    prop.maxValue = this.maxValue;

    return prop;
  }

  copyValuesFrom(prop: FloatProperty) {
    this.minValue = prop.minValue;
    this.maxValue = prop.maxValue;
    this.value = prop.value;
    this.step = prop.step;
  }
}

export class IntProperty extends Property {
  value: number;
  minValue: number = 0;
  maxValue: number = 100;
  step: number = 1;
  constructor(
    name: string,
    displayName: string,
    value: number,
    step: number = 1
  ) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.value = value;
    this.parentValue = value;
    this.step = step;
    this.type = PropertyType.Int;
  }

  getValue(): any {
    return this.value;
  }

  setValue(val: any) {
    // todo: validate
    this.value = val;
  }

  clone(): Property {
    let prop = new IntProperty(
      this.name,
      this.displayName,
      this.value,
      this.step
    );
    prop.minValue = this.minValue;
    prop.maxValue = this.maxValue;

    return prop;
  }

  copyValuesFrom(prop: IntProperty) {
    this.minValue = prop.minValue;
    this.maxValue = prop.maxValue;
    this.value = prop.value;
    this.step = prop.step;
  }
}

export class BoolProperty extends Property {
  value: boolean;
  constructor(name: string, displayName: string, value: boolean) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.value = value;
    this.parentValue = value;
    this.type = PropertyType.Bool;
  }

  getValue(): any {
    return this.value;
  }

  setValue(val: any) {
    // todo: validate
    this.value = val;
  }

  clone(): Property {
    let prop = new BoolProperty(this.name, this.displayName, this.value);

    return prop;
  }

  copyValuesFrom(prop: BoolProperty) {
    this.value = prop.value;
  }
}

export class AssetProperty extends Property {
  values: string[];
  index: number;
  value: string;
  assetType: AssetType;

  constructor(
    name: string,
    displayName: string,
    values: string[],
    assetType: AssetType
  ) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.index = 0;
    this.values = values;
    this.value = this.values[this.index];
    this.parentValue = this.index;
    this.type = PropertyType.Asset;
    this.assetType = assetType;
  }

  getValues(): string[] {
    return this.values;
  }

  getValue(): any {
    return this.values[this.index];
  }

  setValue(val: any) {
    this.index = this.values.indexOf(val);
  }

  clone(): Property {
    let prop = new AssetProperty(
      this.name,
      this.displayName,
      this.values.slice(0),
      this.assetType
    );
    prop.index = this.index;

    return prop;
  }

  copyValuesFrom(prop: AssetProperty) {
    this.values = prop.values;
    this.index = prop.index;
  }
}

export class EnumProperty extends Property {
  values: string[];
  index: number;
  value: string;
  constructor(
    name: string,
    displayName: string,
    values: string[],
    initialIdx: number
  ) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.index = initialIdx;
    this.values = values;
    this.value = this.values[this.index];
    this.parentValue = this.index;
    this.type = PropertyType.Enum;
  }

  getValues(): string[] {
    return this.values;
  }

  getValue(): any {
    return this.index;
  }

  setValue(val: any) {
    this.index = this.values.indexOf(val);
  }

  clone(): Property {
    let prop = new EnumProperty(
      this.name,
      this.displayName,
      this.values.slice(0),
      0
    );
    prop.index = this.index;

    return prop;
  }

  copyValuesFrom(prop: EnumProperty) {
    this.values = prop.values;
    this.index = prop.index;
  }
}

export class ColorProperty extends Property {
  value: Color;
  constructor(name: string, displayName: string, value: Color) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.value = value;
    this.parentValue = value;
    this.type = PropertyType.Color;
  }

  getValue(): any {
    return this.value;
  }

  setValue(val: any) {
    // todo: validate
    console.log("got color: " + val);
    if (val instanceof Color) this.value = val;
    else if (typeof val == "string") this.value = Color.parse(val);
    else if (typeof val == "object") {
      console.log("setting value", val);
      let value = new Color();
      value.r = val.r || 0;
      value.g = val.g || 0;
      value.b = val.b || 0;
      value.a = val.a || 0;

      this.value = value;
    }
  }

  clone(): Property {
    let prop = new ColorProperty(this.name, this.displayName, this.value);

    return prop;
  }

  copyValuesFrom(prop: ColorProperty) {
    this.setValue(prop.value);
  }
}

export class StringProperty extends Property {
  value: string;
  isMultiline: boolean;
  constructor(
    name: string,
    displayName: string,
    value: string = "",
    isMultiline: boolean = false
  ) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.value = value;
    this.parentValue = value;
    this.type = PropertyType.String;
    this.isMultiline = isMultiline;
  }

  getValue(): any {
    return this.value;
  }

  setValue(val: any) {
    // todo: validate
    this.value = val;
  }

  clone(): Property {
    let prop = new StringProperty(this.name, this.displayName, this.value);

    return prop;
  }

  copyValuesFrom(prop: StringProperty) {
    this.value = prop.value;
  }
}

export class FileProperty extends Property {
  value: string;
  extensions: string[];
  constructor(
    name: string,
    displayName: string,
    value: string = "",
    extensions: string[] = ["*"]
  ) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.value = value;
    this.parentValue = value;
    this.extensions = extensions;
    this.type = PropertyType.File;
  }

  getValue(): any {
    return this.value;
  }

  setValue(val: any) {
    // todo: validate
    this.value = val;
  }

  clone(): Property {
    let prop = new FileProperty(this.name, this.displayName, this.value);

    return prop;
  }

  copyValuesFrom(prop: FileProperty) {
    this.value = prop.value;
  }
}

export class GradientProperty extends Property {
  value: Gradient;
  constructor(name: string, displayName: string, value: Gradient) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.value = value;
    this.parentValue = value;
    this.type = PropertyType.Gradient;
  }

  getValue(): any {
    return this.value;
  }

  setValue(val: any) {
    console.log("setting gradient value");
    this.value = Gradient.parse(val);
  }

  clone(): Property {
    let prop = new GradientProperty(
      this.name,
      this.displayName,
      this.value.clone()
    );

    return prop;
  }

  copyValuesFrom(prop: GradientProperty) {
    console.log("copy value from gradient");
    this.setValue(prop.value.clone());
  }
}

export class Transform2DProperty extends Property {
  value: Transform2D;
  // positionX: number;
  // positionY: number;
  // scaleX: number;
  // scaleY: number;
  // rotation: number;

  constructor(name: string, displayName: string, value: Transform2D) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.value = value;
    this.parentValue = value;
    this.type = PropertyType.Transform2D;
  }

  getValue(): any {
    return this.value;
  }

  setValue(val: any) {
    this.value.position = new Vector2(val.position);
    this.value.scale = new Vector2(val.scale);
    this.value.rotation = val.rotation;
  }

  clone(): Property {
    let prop = new Transform2DProperty(
      this.name,
      this.displayName,
      this.value.clone()
    );

    return prop;
  }

  copyValuesFrom(prop: Transform2DProperty) {
    console.log("copy value from transform2d");
    this.setValue(prop.value.clone());
  }
}
