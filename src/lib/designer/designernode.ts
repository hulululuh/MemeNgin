// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { Guid } from "@/lib/utils";
import { Designer } from "@/lib/designer";
import { Editor } from "@/lib/editor";
import {
  Property,
  FloatProperty,
  IntProperty,
  BoolProperty,
  EnumProperty,
  ColorProperty,
  StringProperty,
  FileProperty,
  GradientProperty,
  IPropertyHolder,
  Transform2DProperty,
  CurveProperty,
  AssetProperty,
  Vector2Property,
  CurveData,
} from "@/lib/designer/properties";
import { AssetType } from "@/assets/assetmanager";
import { Color } from "@/lib/designer/color";
import { Gradient } from "@/lib/designer/gradient";
import { WidgetEvent } from "@/lib/scene/graphicsitem";
import { Transform2D } from "@/lib/math/transform2d";
import { Vector2 } from "@math.gl/core";
import { WidgetType } from "@/lib/scene/widget";

const POTs: number[] = [
  1,
  2,
  4,
  8,
  16,
  32,
  64,
  128,
  256,
  512,
  1024,
  2048,
  4096,
];

export class NodeInput {
  node: DesignerNode;
  name: string;
}

export enum NodeType {
  Procedural,
  Texture,
  Text,
  Logic,
}

export enum NodeCategory {
  Undefined = "undefined",
  Shape = "shape",
  Color = "color",
  Composite = "composite",
  Create = "create",
  Logic = "logic",
  Control = "control",
  Experimental = "experimental",
}

export class DesignerNode implements IPropertyHolder {
  id: string;
  texPath: string;
  imgData: string;
  isDataUrl: boolean;
  title: string;
  typeName: string; // added when node is created from library
  nodeType: NodeType;
  nodeCategory: NodeCategory;

  // this indicates which node should we use, when it needs to be resized
  parentIndex: string;

  gl: WebGL2RenderingContext;
  designer: Designer;

  exportName: string;

  inputs: string[] = new Array();
  properties: Property[] = new Array();
  needsUpdate: boolean = true;

  // we assume that designer node does not need a widget by default
  widgetType: WidgetType = WidgetType.None;

  onPropertyLoaded?: () => void;
  onResized?: () => void;
  onConnected?: (leftNode: DesignerNode, rightIndex: string) => void;
  onWidgetDragged?: (evt: WidgetEvent) => void;
  onWidgetDragStarted?: (evt: WidgetEvent) => void;
  onWidgetDragEnded?: (evt: WidgetEvent) => void;

  // default behaviour: turn off transform widget
  onItemSelected(): void {
    const event = new WidgetEvent("widgetUpdate", {
      detail: {
        enable: false,
      },
    });

    document.dispatchEvent(event);
  }

  // constructor
  constructor() {
    if (!this.id) this.id = Guid.newGuid();
    this.nodeType = NodeType.Procedural;
    this.nodeCategory = NodeCategory.Undefined;
  }

  getCenter(): Vector2 {
    const scene = Editor.getScene();
    const result = scene.nodes.filter((item) => item.id === this.id)[0];

    if (result) {
      const pos = result.getPos();
      return new Vector2(
        pos.x + result.getWidth() / 2,
        pos.y + result.getHeight() / 2
      );
    } else {
      return new Vector2(0, 0);
    }
  }

  // callbacks
  onthumbnailgenerated: (DesignerNode, HTMLImageElement) => void;
  onnodepropertychanged?: (prop: Property) => void;
  ondisconnected?: (node: DesignerNode, name: string) => void;
  notifyRightNodes?: () => void;

  onnodeexposechanged(prop: Property) {
    const scene = Editor.getScene();
    const item = scene.nodes.filter((item) => item.id === this.id)[0];

    if (!item) return;
    // expose turned off - remove active connections
    if (!prop.getExposed()) {
      let leftNode = this.designer.findLeftNode(this.id, prop.name);
      this.designer.removeConnection(leftNode, this, prop.name);
      scene.removeAssociatedConnections(item, prop.name);
      item.removeSocketByProp(prop.name);
    } else {
      item.addSocketByProp(prop.name, prop.type);
    }

    item.sortSockets();
  }

  // an update is requested when:
  // a property is changed
  // a new connection is made
  // a connection is removed
  //
  // all output connected nodes are invalidated as well
  requestUpdate() {
    this.designer.requestUpdate(this);
  }

  getInputs(): string[] {
    return this.inputs;
  }

  protected addInput(name: string) {
    this.inputs.push(name);
  }

  getExposedProperties(): Array<Property> {
    let exposed = [];
    for (let prop of this.properties) {
      // have child properties - check inside
      if (prop.hasChildren) {
        // assume that property can only have second depth
        for (let child of prop.children) {
          if (child instanceof Property && child.exposed) {
            exposed.push(child);
          }
        }
      } else {
        if (prop.exposed) exposed.push(prop);
      }
    }
    return exposed;
  }

  getProperty(name: string): any {
    let prop = this.properties.find((x) => x.name === name);
    if (prop) {
      return this.evaluatePropertyValue(prop);
    } else {
      console.error("can not find property: " + name);
      return "";
    }
  }

  setProperty(name: string, value: any) {
    let prop = this.properties.find((x) => {
      return x.name == name;
    });

    // search for child prop
    if (!prop) {
      let parents = [];
      for (let p of this.properties) {
        if (p.children.length > 0) parents.push(p);
      }

      for (let parent of parents) {
        prop = parent.children.find((item) => item.name == name);

        if (prop) break;
      }
    }

    // set prop
    if (prop) {
      if (prop instanceof EnumProperty) {
        let index = prop.values.indexOf(value["value"]);

        if (index == -1) {
          index = value["value"];
        }
        prop.setValue(index);
      } else if (
        prop instanceof StringProperty ||
        prop instanceof FloatProperty ||
        prop instanceof IntProperty
      ) {
        // search for variable property
        prop.setValue(value["value"]);
        if (this.onnodepropertychanged) this.onnodepropertychanged(prop);
      } else {
        prop.setValue(value["value"]);
      }

      prop.setExposed(value["exposed"]);

      const displayName = value["displayName"];
      if (displayName) {
        prop.setDisplayName(displayName);
      }
      this.requestUpdate();
    } else {
      console.error("can not find property: " + name);
    }

    // editing started
    if (document) {
      const event = new Event("editStarted");
      document.dispatchEvent(event);
    }
  }

  _init() {}

  protected init() {}

  connected(leftNode: DesignerNode, rightIndex: string) {}

  isParentIndex(name: string): boolean {
    // if the node has one input then it is a prime index
    if (this.inputs.length < 2) {
      return true;
    } else {
      return name === this.parentIndex;
    }
  }

  getParentNode(): any {
    return Editor.getDesigner().findLeftNode(this.id, this.parentIndex);
  }

  evaluatePropertyValue(prop: Property) {
    let value;
    let leftNode = this.designer.findLeftNode(this.id, prop.name);
    if (leftNode && prop.getExposed()) {
      value = prop.getParentValue();
    } else {
      value = prop.getValue();
    }

    return value;
  }

  // PROPERTY FUNCTIONS
  addIntProperty(
    id: string,
    displayName: string,
    defaultVal: number = 1,
    minVal: number = 1,
    maxVal: number = 100,
    increment: number = 1,
    modifiable: boolean = true
  ): IntProperty {
    //let prop = new IntProperty(id, displayName, defaultVal);

    let prop = new FloatProperty(
      id,
      displayName,
      defaultVal,
      increment,
      modifiable
    );
    prop.minValue = minVal;
    prop.maxValue = maxVal;
    prop.step = increment;

    this.properties.push(prop);
    return prop;
  }

  addFloatProperty(
    id: string,
    displayName: string,
    defaultVal: number = 1,
    minVal: number = 1,
    maxVal: number = 100,
    increment: number = 1,
    modifiable: boolean = true
  ): FloatProperty {
    let prop = new FloatProperty(
      id,
      displayName,
      defaultVal,
      increment,
      modifiable
    );
    prop.minValue = minVal;
    prop.maxValue = maxVal;
    prop.step = increment;

    this.properties.push(prop);
    return prop;
  }

  addBoolProperty(
    id: string,
    displayName: string,
    defaultVal: boolean = false
  ): BoolProperty {
    let prop = new BoolProperty(id, displayName, defaultVal);

    this.properties.push(prop);
    return prop;
  }

  addCurveProperty(
    id: string,
    displayName: string,
    defaultVal: CurveData
  ): CurveProperty {
    let prop = new CurveProperty(id, displayName, defaultVal);
    this.properties.push(prop);
    return prop;
  }

  addAssetProperty(
    id: string,
    displayName: string,
    assetType: AssetType
  ): AssetProperty {
    let prop = new AssetProperty(id, displayName, assetType);

    this.properties.push(prop);
    return prop;
  }

  addEnumProperty(
    id: string,
    displayName: string,
    defaultVal: string[] = new Array(),
    initialIdx: number = 0
  ): EnumProperty {
    let prop = new EnumProperty(id, displayName, defaultVal, initialIdx);

    this.properties.push(prop);
    return prop;
  }

  addColorProperty(
    id: string,
    displayName: string,
    defaultVal: Color
  ): ColorProperty {
    let prop = new ColorProperty(id, displayName, defaultVal);

    this.properties.push(prop);
    return prop;
  }

  addStringProperty(
    id: string,
    displayName: string,
    defaultVal: string = ""
  ): StringProperty {
    let prop = new StringProperty(id, displayName, defaultVal);

    this.properties.push(prop);
    return prop;
  }

  addFileProperty(
    id: string,
    displayName: string,
    defaultVal: string = "",
    extensions: string = "*"
  ): FileProperty {
    let prop = new FileProperty(id, displayName, defaultVal, extensions);

    this.properties.push(prop);
    return prop;
  }

  addGradientProperty(
    id: string,
    displayName: string,
    defaultVal: Gradient
  ): GradientProperty {
    let prop = new GradientProperty(id, displayName, defaultVal);

    this.properties.push(prop);
    return prop;
  }

  addTransform2DProperty(
    id: string,
    displayName: string,
    defaultVal: Transform2D,
    ownerId: string
  ): Transform2DProperty {
    let prop = new Transform2DProperty(id, displayName, defaultVal);
    prop.ownerId = ownerId;

    this.properties.push(prop);
    return prop;
  }

  addVector2Property(
    id: string,
    displayName: string,
    defaultVal: Vector2
  ): Vector2Property {
    let prop = new Vector2Property(id, displayName, defaultVal);

    this.properties.push(prop);
    return prop;
  }

  getPropertyValueByName(name: string): any {
    const idx: number = this.properties.findIndex((item) => item.name == name);
    if (idx == -1) return;
    return this.getPropertyValue(idx);
  }

  getPropertyValue(idx: number = 0): any {
    let inputNode = this.designer.findLeftNode(
      this.id,
      this.properties[idx].name
    );

    if (inputNode) {
      return this.properties[idx].getParentValue();
    } else {
      return this.properties[idx].getValue();
    }
  }
}
