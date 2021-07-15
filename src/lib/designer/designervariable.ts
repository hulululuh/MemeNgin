// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { DesignerNode } from "./designernode";
import { Property } from "./properties";

export enum DesignerVariableType {
  None = 0,
  Float = 1,
  Int = 2,
  Bool = 3,
  Enum = 4,
  Color = 5,
  Asset = 6,
  //Gradient
}

export class DesignerNodePropertyMap {
  node: DesignerNode;
  propertyName: string;
}

export class DesignerVariable {
  id: string;

  type: DesignerVariableType;
  // used to keep the value in bounds
  property: Property;

  nodes: DesignerNodePropertyMap[] = new Array();
}
