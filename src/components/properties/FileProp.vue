<template>
  <v-container class="field ma-0 pa-0">
    <v-subheader class="ma-0 pa-0">
      <property-name
        ref="propertyName"
        @onApply="onApply"
        @onCancel="onCancel"
      />
    </v-subheader>
    <v-file-input dense @change="updateValue" />
  </v-container>
</template>

<style scoped lang="scss">
  @import "../../../public/scss/property.scss";
</style>

<script lang="ts">
  // [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

  import { Vue, Prop, Component, Emit } from "vue-property-decorator";
  import { Designer } from "@/lib/designer";
  import { IPropertyHolder } from "../../lib/designer/properties";
  import { PropertyChangeAction } from "@/lib/actions/propertychangeaction";
  import { UndoStack } from "@/lib/undostack";
  import { remote } from "electron";
  import PropertyName from "@/components/properties/PropertyName.vue";
  import fs from "fs";
  const dialog = remote.dialog;

  @Component({
    components: {
      propertyName: PropertyName,
    },
  })
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

    get propertyName() {
      return this.$refs.propertyName as PropertyName;
    }

    mounted() {
      this.propertyName.name = this.prop.displayName;
    }

    onApply() {
      this.prop.displayName = this.propertyName.name;
    }

    onCancel() {
      this.propertyName.name = this.prop.displayName;
    }

    @Emit()
    propertyChanged() {
      this.$emit("propertyChanged", this.prop, this.propHolder);
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
