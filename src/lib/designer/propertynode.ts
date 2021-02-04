import { Guid } from "@/lib/utils";
import { Property } from "@/lib/designer/properties";

export class PropertyNode {
  id: string = Guid.newGuid();
  prop: Property;

  constructor() {}
}
