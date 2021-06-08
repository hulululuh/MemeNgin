<template>
  <form
    class="properties"
    @submit.prevent="cancelSubmit"
    :key="node.id"
    v-if="node != null"
  >
    <v-expansion-panels v-model="panel" multiple accordion>
      <v-expansion-panel>
        <v-expansion-panel-header class="propertyList"
          >Properties</v-expansion-panel-header
        >
        <v-expansion-panel-content>
          <component
            v-for="(p, index) in this.properties"
            :is="p.componentName"
            :prop="p.prop"
            :propHolder="node"
            :editor="editor"
            @propertyChanged="propertyChanged"
            @property-change-completed="propertyChangeCompleted"
            @propertyExposeChanged="propertyExposeChanged"
            :key="index"
          ></component>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </form>
</template>

<style scoped lang="scss">
  @import "../../public/scss/property.scss";
</style>

<script lang="ts">
  import { Editor } from "@/lib/editor";
  import { DesignerNode } from "@/lib/designer/designernode";
  import { Property, IPropertyHolder } from "@/lib/designer/properties";
  import { Vue, Prop, Component } from "vue-property-decorator";
  import FloatPropertyView from "@/components/properties/FloatProp.vue";
  import BoolPropertyView from "@/components/properties/BoolProp.vue";
  import EnumPropertyView from "@/components/properties/EnumProp.vue";
  import AssetPropertyView from "@/components/properties/AssetProp.vue";
  import ColorPropertyView from "@/components/properties/ColorProp.vue";
  import Accordion from "@/components/Accordion.vue";
  import GradientPropertyView from "@/components/properties/GradientProp.vue";
  import StringPropertyView from "@/components/properties/StringProp.vue";
  import FilePropertyView from "@/components/properties/FileProp.vue";
  import Transform2DPropertyView from "@/components/properties/Transform2DProp.vue";
  import Vector2PropertyView from "@/components/properties/Vector2Prop.vue";
  import {
    IProperyUi,
    PropertyChangeComplete,
  } from "../components/properties/ipropertyui";

  /* eslint-disable */

  class PropHolder {
    prop: Property;
    componentName: string;
  }

  @Component({
    components: {
      float: FloatPropertyView,
      int: FloatPropertyView,
      bool: BoolPropertyView,
      enum: EnumPropertyView,
      color: ColorPropertyView,
      gradient: GradientPropertyView,
      string: StringPropertyView,
      file: FilePropertyView,
      transform2d: Transform2DPropertyView,
      vector2: Vector2PropertyView,
      asset: AssetPropertyView,

      Accordion,
    },
  })
  export default class NodePropertiesView extends Vue implements IProperyUi {
    @Prop()
    node: IPropertyHolder;

    @Prop()
    editor: Editor;

    items: any;

    panel: any;

    created() {
      this.items = [{ name: "Base Properties" }, { name: "Properties" }];

      this.panel = [...Array(this.items.length).keys()];
    }

    data() {
      return {
        panel: this.panel,
        items: this.items,
      };
    }

    propertyChanged(prop: Property) {
      if (this.node.onnodepropertychanged) {
        this.node.onnodepropertychanged(prop);
      }
      // if (this.editor.onnodepropertychanged)
      //   this.editor.onnodepropertychanged(self.node, prop);
    }

    propertyExposeChanged(prop: Property) {
      if (this.node.onnodeexposechanged) {
        this.node.onnodeexposechanged(prop);
      }
    }

    // this is needed for undo-redo
    // some actions dont count as a full change until
    // the mouse button is up or the widget loses focus
    // like moving a slider
    // or typing text
    propertyChangeCompleted(evt: PropertyChangeComplete) {
      console.log("property change!");

      // let action = new PropertyChangeAction(
      // 	this,
      // 	evt.propName,
      // 	this.node,
      // 	evt.oldValue,
      // 	evt.newValue
      // );
      // UndoStack.current.push(action);
    }

    cancelSubmit() {
      return false;
    }

    // calculated
    get properties(): PropHolder[] {
      // if (this.node instanceof OutputNode) {
      //   let inputprops = Editor.getInstance().getInputItem().inputProperties;
      //   let props: PropHolder[] = [];

      //   for (let prop of inputprops) {
      //     props.push({ prop: prop, componentName: prop.type });
      //   }
      //   return props;
      // } else {
      //   let props: PropHolder[] = this.node.properties.map((prop) => {
      //     //let name: string = "";
      //     return {
      //       prop: prop,
      //       componentName: prop.type,
      //     };
      //   });

      //   //console.log(props);
      //   return props;
      // }

      let props: PropHolder[] = this.node.properties.map((prop) => {
        //let name: string = "";
        return {
          prop: prop,
          componentName: prop.type,
        };
      });

      //console.log(props);
      return props;
    }

    get isInstanceNode() {
      return this.node instanceof DesignerNode;
    }

    get getNode(): DesignerNode {
      return this.node as DesignerNode;
    }

    refresh() {
      this.$forceUpdate();
    }
  }
</script>
