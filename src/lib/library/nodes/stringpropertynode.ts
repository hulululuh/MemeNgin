import { LogicDesignerNode, LogicType } from "@/lib/designer/logicdesignernode";
import { PropertyType, Property } from "@/lib/designer/properties";

export class StringPropertyNode extends LogicDesignerNode {
  propNames: string[];
  constructor() {
    super();

    this.onnodepropertychanged = function(prop: Property) {
      if (prop.name === "value") {
        this.updateVariableProperty();
        this.requestUpdate();
      }
    };
  }

  updateVariableProperty() {
    //let variables = this.calculated().match(/\${(.*?)}/g);
    let variables = this.getPropertyValue(0).match(/\${(.*?)}/g);
    if (!variables) variables = [];
    this.propNames = [];
    variables.forEach((element) => {
      let name = element.substring(2, element.length - 1);
      if (name.length > 0) this.propNames.push(name);
    });

    let existingVariableProps = [];
    for (let p of this.properties) {
      if (p.name != "value") existingVariableProps.push(p.name);
    }

    let added = this.propNames.filter(
      (item) => existingVariableProps.indexOf(item) < 0
    );
    let toRemoved = existingVariableProps.filter(
      (item) => this.propNames.indexOf(item) < 0
    );

    for (let name of added) {
      this.addStringProperty(name, name, "");
    }

    for (let name of toRemoved.reverse()) {
      let idx = this.properties.findIndex((item) => item.name == name);
      if (idx >= 0) this.properties.splice(idx, 1);
    }
  }

  init() {
    this.title = "StringProperty";
    this.logicType = LogicType.Property;
    this.outputType = PropertyType.String;

    this.addStringProperty("value", "Value", "");
  }

  calculated() {
    let value = this.getPropertyValue(0);

    let calculated = value.replace(/\${(.*?)}/g, (x, g) => {
      let prop = this.properties.find((x) => x.name === g);
      return prop ? this.evaluatePropertyValue(prop) : "";
    });
    return calculated;
    //return this.getPropertyValue(0);
  }
}
