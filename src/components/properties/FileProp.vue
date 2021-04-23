<template>
  <v-container class="field ma-0 pa-0">
    <v-subheader class="ma-0 pa-0">
      <label>{{ prop.displayName }}</label>
    </v-subheader>
    <v-file-input @change="updateValue" />
  </v-container>
</template>

<style scoped lang="scss">
  @import "../../../public/scss/property.scss";
</style>

<script lang="ts">
  import { Vue, Prop, Component, Emit } from "vue-property-decorator";
  import { Designer } from "@/lib/designer";
  import { IPropertyHolder } from "../../lib/designer/properties";
  import { PropertyChangeAction } from "@/lib/actions/propertychangeaction";
  import { UndoStack } from "@/lib/undostack";
  import { remote } from "electron";
  import fs from "fs";
  const dialog = remote.dialog;

  //const { dialog } = require("electron").remote;
  @Component
  export default class FilePropertyView extends Vue {
    @Prop()
    // FloatProperty
    prop: any;

    @Prop()
    designer: Designer;

    @Prop()
    propHolder: IPropertyHolder;

    oldValue: any;

    path: string = "";

    // mounted() {
    //   this.propertyChanged();
    // }

    @Emit()
    propertyChanged() {
      this.$emit("propertyChanged", this.prop);
      return this.prop.name;
    }

    updateValue(value) {
      this.path = value.path;
      if (this.path && fs.existsSync(this.path)) {
        this.propHolder.setProperty(this.prop.name, {
          value: this.path,
          exposed: false,
        });
        this.propertyChanged();
      }
    }

    onclick() {
      let result = dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Images", extensions: this.prop.extensions }],
        //filters: [{ name: "Images", extensions: ["jpg", "png"] }],
      });

      if (result && fs.existsSync(result[0])) {
        this.propHolder.setProperty(this.prop.name, result[0]);
        this.propertyChanged();
      }
    }

    focus() {
      this.oldValue = this.prop.value;
    }

    blur() {
      let action = new PropertyChangeAction(
        null,
        this.prop.name,
        this.propHolder,
        this.oldValue,
        (this.oldValue = {
          value: this.prop.getValue(),
          exposed: this.prop.getExposed(),
        })
      );
      UndoStack.current.push(action);

      this.oldValue = {
        value: this.prop.getValue(),
        exposed: this.prop.getExposed(),
      };
    }
  }
</script>
