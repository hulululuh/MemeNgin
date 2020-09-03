<template>
  <div class="field">
    <div>
      <label>{{ prop.displayName }}</label>
    </div>
    <div class="input-holder">
      <div style="width:100%;">
        <input
          type="text"
          :value="prop.value"
          @input="updateValue"
          style="width:100%"
          @focus="focus"
          @blur="blur"
          disabled
        />
      </div>
      <div style="width:8%;" float="right;">
        <button class="block" @click="onclick">...</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, Emit } from "vue-property-decorator";
import { Designer } from "@/lib/designer";
import { DesignerNode } from "@/lib/designer/designernode";
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

  oldValue: number;

  @Emit()
  propertyChanged() {
    this.$emit("propertyChanged", this.prop);
    return this.prop.name;
  }

  updateValue(evt) {
    this.propHolder.setProperty(this.prop.name, evt.target.value);
    this.propertyChanged();
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
      this.prop.value
    );
    UndoStack.current.push(action);
  }
}
</script>

<style scoped>
.field {
  font-size: 12px;
  padding: 0.9em 0.5em;
  color: rgba(255, 255, 255, 0.7);
  border-bottom: 1px rgb(61, 61, 61) solid;
}

.field label {
  font-weight: bold;
  padding: 0.4em;
  padding-left: 0;
}

.number {
  width: calc(100% - 4px - 1px);
  border: solid gray 1px;
  padding: 2px;
  border-radius: 2px;
}

.input-holder {
  display: flex;
}

.block {
  display: flex;
}
</style>
