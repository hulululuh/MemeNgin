// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { DesignerNode, NodeCategory } from "./designernode";

// TODO: Will need generalized converter here.
export const mappingFunc = new Map<string, string>([
  ["overlay", "blend"],
  ["overlayquad", "blendquad"],
]);

export class DesignerNodeFactory {
  name: string;
  displayName: string;
  category: NodeCategory;
  create: () => DesignerNode;
}

// holds list of node factories
export class DesignerLibrary {
  versionName: string;
  nodes = new Array();

  // https://www.snip2code.com/Snippet/685188/Create-instance-of-generic-type-on-TypeS
  addNode<T extends DesignerNode>(
    name: string,
    displayName: string,
    type: { new (): T },
    category: NodeCategory = NodeCategory.Undefined
  ) {
    let factory = new DesignerNodeFactory();
    factory.name = name;
    factory.displayName = displayName;
    factory.category = category;
    factory.create = (): DesignerNode => {
      return new type();
    };

    //this.nodes.push(factory);
    this.nodes[name] = factory;
  }

  getVersionName() {
    return this.versionName;
  }

  create(name: string, path?: string, isUrl?: boolean): DesignerNode {
    let target = name;
    if (!this.nodes[name]) {
      target = mappingFunc.get(name);

      if (!this.nodes[target]) return null;
    }

    let node = this.nodes[target].create();
    if (path) {
      if (isUrl) {
        node.imgData = path;
      } else {
        node.texPath = path;
      }
    }

    if (node.isDataUrl != undefined && isUrl !== undefined) {
      node.isDataUrl = isUrl;
    }

    node.typeName = name;

    return node;
  }
}
