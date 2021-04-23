import { Transform2D } from "../math/transform2d";
import { Vector2 } from "math.gl";
import { Color } from "./color";
import { Gradient } from "./gradient";
import { AssetType } from "@/assets/assetmanager";

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
  Vector2 = "vector2",
  Asset = "asset",

  // use it on the socket
  Image = "image",
}

export class Property {
  name: string;
  displayName: string;
  type: string;
  exposed: any;
  parentValue: any;

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

  setExposed(val: any) {
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
    this.exposed = false;
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
    this.exposed = false;
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
    this.exposed = false;
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
    this.exposed = false;
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
  index: number = -1;
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
    this.exposed = false;
  }

  getValues(): string[] {
    return this.values;
  }

  getValue(): any {
    if (this.index == -1) {
      this.index = this.values.indexOf(this.value);
    }
    return this.index;
  }

  setValue(index: number) {
    //this.index = this.values.indexOf(val);
    this.index = index;
    this.value = this.values[this.index];
  }

  clone(): Property {
    let prop = new EnumProperty(
      this.name,
      this.displayName,
      this.values.slice(0),
      this.index
    );
    prop.index = this.index;

    return prop;
  }

  copyValuesFrom(prop: EnumProperty) {
    this.values = prop.values;
    this.index = prop.index;
    this.value = prop.value;
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
    this.exposed = false;
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
    this.exposed = false;
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
    this.exposed = false;
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
    this.exposed = false;
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

export enum TransformComponent {
  None = 0,
  Position = 1,
  Scale = 1 << 1,
  Rotation = 1 << 2,
  ALL = Position | Scale | Rotation,
}
export class Transform2DProperty extends Property {
  value: Transform2D;
  pExposed: boolean;
  sExposed: boolean;
  rExposed: boolean;

  constructor(name: string, displayName: string, value: Transform2D) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.value = value;
    this.parentValue = value;
    this.type = PropertyType.Transform2D;
    this.exposed = TransformComponent.None;
  }

  get positionExposed() {
    return this.pExposed;
  }

  get scaleExposed() {
    return this.sExposed;
  }

  get rotationExposed() {
    return this.rExposed;
  }

  set positionExposed(value) {
    this.pExposed = value;
  }

  set scaleExposed(value) {
    this.sExposed = value;
  }

  set rotationExposed(value) {
    this.rExposed = value;
  }

  getExposed() {
    this.updateExposed();
    return this.exposed;
  }

  setExposed(val: any) {
    this.exposed = val;
    this.pExposed = (this.exposed & TransformComponent.Position) != 0;
    this.sExposed = (this.exposed & TransformComponent.Scale) != 0;
    this.rExposed = (this.exposed & TransformComponent.Rotation) != 0;
  }

  private updateExposed() {
    this.exposed =
      (this.pExposed ? TransformComponent.Position : 0) |
      (this.sExposed ? TransformComponent.Scale : 0) |
      (this.rExposed ? TransformComponent.Rotation : 0);
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

export class Vector2Property extends Property {
  value: Vector2;
  constructor(name: string, displayName: string, value: Vector2) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.value = new Vector2(value);
    this.parentValue = new Vector2(value);
    this.type = PropertyType.Vector2;
    this.exposed = false;
  }

  getValue(): any {
    return this.value;
  }

  setValue(val: any) {
    // todo: validate
    this.value = val;
  }

  clone(): Property {
    let prop = new Vector2Property(
      this.name,
      this.displayName,
      this.value.clone()
    );

    return prop;
  }

  copyValuesFrom(prop: Vector2Property) {
    this.value = prop.value.clone();
  }
}
