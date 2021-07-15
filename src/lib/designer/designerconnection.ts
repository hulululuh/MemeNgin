// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { DesignerNode } from "./designernode";
import { Guid } from "../utils";

export class DesignerNodeConn {
  id: string = Guid.newGuid();

  leftNode: DesignerNode;
  leftNodeOutput: string = ""; // if null, use first output

  rightNode: DesignerNode;
  rightNodeInput: string;
}
