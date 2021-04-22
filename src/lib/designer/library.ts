import { DesignerNode, NodeCategory } from "./designernode";
import { TextureNode } from "@/lib/library/nodes/texturenode";

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
    //if (this.nodes.indexOf(name) == -1)
    //    return null;

    let node = this.nodes[name].create();
    if (path) {
      if (isUrl) {
        node.imgData = path;
      } else {
        node.texPath = path;
      }
    }

    if (node instanceof TextureNode && isUrl !== undefined) {
      (node as TextureNode).isDataUrl = isUrl;
    }

    node.typeName = name;

    return node;
  }
}
