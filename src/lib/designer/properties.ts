// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { Transform2D } from "@/lib/math/transform2d";
import { Vector2 } from "math.gl";
import { Color } from "@/lib/designer/color";
import { Gradient } from "@/lib/designer/gradient";
import { AssetManager, AssetType } from "@/assets/assetmanager";
import { Editor } from "@/lib/editor";

export const PROPERTY_NAME_RULES = [
  (v) => !!v || "Property name is required",
  (v) => (v && v.length <= 25) || "Name must be less than 25 characters",
];

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
  Curve = "curve",
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
  connected: boolean;
  children: Property[];
  modifiable: boolean;

  constructor(modifiable: boolean = true) {
    this.exposed = false;
    this.connected = false;
    this.children = [];
    this.modifiable = modifiable;
  }

  get hasChildren() {
    return this.children.length > 0;
  }

  getDisplayName(): string {
    return this.displayName;
  }

  setDisplayName(val: string) {
    this.displayName = val;
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
    step: number = 1,
    modifiable: boolean = true
  ) {
    super(modifiable);
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

export class CurveData {
  cpStart: Array<number>;
  cpEnd: Array<number>;

  constructor(_cpStart: Array<number>, _cpEnd: Array<number>) {
    Object.assign(this, { cpStart: _cpStart, cpEnd: _cpEnd });
  }

  clone() {
    let data = new CurveData(
      new Vector2(this.cpStart),
      new Vector2(this.cpEnd)
    );
    return data;
  }

  equals(other: CurveData) {
    return (
      this.cpStart[0] == other.cpStart[0] &&
      this.cpStart[1] == other.cpStart[1] &&
      this.cpEnd[0] == other.cpEnd[0] &&
      this.cpEnd[1] == other.cpEnd[1]
    );
  }
}
export class CurveProperty extends Property {
  value: CurveData;

  constructor(name: string, displayName: string, value: CurveData) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.value = value;
    this.parentValue = value;
    this.type = PropertyType.Curve;
  }

  getValue(): any {
    return this.value;
  }

  setValue(val: CurveData) {
    // todo: validate
    this.value = val;
  }

  clone(): Property {
    let prop = new CurveProperty(this.name, this.displayName, this.value);

    return prop;
  }

  copyValuesFrom(prop: CurveProperty) {
    this.value = prop.value;
  }
}

export class AssetProperty extends Property {
  value: string;
  assetType: AssetType;

  constructor(name: string, displayName: string, assetType: AssetType) {
    super();
    this.name = name;
    this.displayName = displayName;

    if (!this.value) {
      this.value = this.values[0];
    }
    this.parentValue = this.value;
    this.type = PropertyType.Asset;
    this.assetType = assetType;
  }

  get values(): string[] {
    return AssetManager.getInstance().fontIds;
  }

  getValues(): string[] {
    return this.values;
  }

  getValue(): any {
    return this.value;
  }

  setValue(val: any) {
    this.value = val;
  }

  clone(): Property {
    let prop = new AssetProperty(
      this.name,
      this.displayName,
      //this.values.slice(0),
      this.assetType
    );

    return prop;
  }

  copyValuesFrom(prop: AssetProperty) {
    //this.values = prop.values;
    this.value = prop.value;
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
  extensions: string;
  constructor(
    name: string,
    displayName: string,
    value: string = "",
    extensions: string = "*"
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

  ownerId: string;

  pProp: Vector2Property;
  sProp: Vector2Property;
  rProp: FloatProperty;

  constructor(name: string, displayName: string, value: Transform2D) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.value = value;
    this.parentValue = value;
    this.type = PropertyType.Transform2D;
    this.exposed = true;

    this.pProp = new Vector2Property("xf_pos", "xf_pos", new Vector2(0, 0));
    this.sProp = new Vector2Property("xf_scale", "xf_scale", new Vector2(1, 1));
    this.rProp = new FloatProperty("xf_rot", "xf_rot", 0.0);
    this.children = [this.pProp, this.sProp, this.rProp];
  }

  get positionExposed() {
    return this.pProp.exposed;
  }

  get scaleExposed() {
    return this.sProp.exposed;
  }

  get rotationExposed() {
    return this.rProp.exposed;
  }

  set positionExposed(value) {
    this.pProp.exposed = value;
  }

  set scaleExposed(value) {
    this.sProp.exposed = value;
  }

  set rotationExposed(value) {
    this.rProp.exposed = value;
  }

  getExposed() {
    return this.exposed;
  }

  setExposed(val: any) {
    this.exposed = val;
  }

  getValue(): any {
    let pCon =
      Editor.getDesigner().findLeftNode(this.ownerId, this.pProp.name) != null;
    let sCon =
      Editor.getDesigner().findLeftNode(this.ownerId, this.sProp.name) != null;
    let rCon =
      Editor.getDesigner().findLeftNode(this.ownerId, this.rProp.name) != null;

    if (pCon || sCon || rCon) {
      let p = pCon ? this.pProp.getParentValue() : this.value.position;
      let s = sCon ? this.sProp.getParentValue() : this.value.scale;
      let r = rCon ? this.rProp.getParentValue() : this.value.rotation;
      let xf = new Transform2D(p, s, r);
      return xf;
    } else {
      return this.value;
    }
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
