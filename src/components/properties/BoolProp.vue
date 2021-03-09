<template>
  <v-container class="field ma-0 pa-0">
    <v-subheader class="ma-0 pa-0">
      {{prop.displayName}}
    </v-subheader>
    <v-input class="ma-0 pa-0" hide-details>
      <template v-slot:prepend>
        <v-checkbox
          v-model="prop.exposed"
          v-on:change="updateExposed"
          class="ma-0 pa-0"
          hide-details>
        </v-checkbox>
      </template>
      <v-btn
        v-model="prop.value"
        @click="toggleValue"
        block>
        {{valueText}}
      </v-btn>
    </v-input>
  </v-container>
</template>

<style scoped lang="scss">
@import "../../../public/scss/property.scss";
</style>

<script lang="ts">
import { Vue, Prop, Component, Emit, Model } from "vue-property-decorator";
import { Designer } from "@/lib/designer";
import { IPropertyHolder } from "../../lib/designer/properties";
import { PropertyChangeComplete } from "./ipropertyui";
import { PropertyChangeAction } from "@/lib/actions/propertychangeaction";
import { UndoStack } from "@/lib/undostack";

@Component
export default class BoolPropertyView extends Vue {
  @Prop()
  // BoolProperty
  prop: any;

  @Prop()
  designer: Designer;

  @Prop()
  propHolder: IPropertyHolder;

  @Emit()
  propertyChanged() {
    this.$emit("propertyChanged", this.prop);
    return this.prop.name;
  }

  @Emit()
  propertyChangeCompleted(evt: PropertyChangeComplete) {
    return evt;
  }

  @Emit()
  propertyExposeChanged() {
    this.$emit("propertyExposeChanged", this.prop);
    return this.prop.name;
  }

  updateExposed(value) { 
    this.propHolder.setProperty(this.prop.name, {value: this.prop.getValue(), exposed: value});
    this.propertyExposeChanged();
  }

  //value: boolean = true;
  get valueText() : string {
    return this.prop.value ? "True" : "False";
  }
  mounted() {
    //this.value = this.prop.value;
  }

  toggleValue() {
    let evt = { propName: this.prop.name, oldValue: null, newValue: null };
    let oldValue = this.prop.value;
    evt.newValue = !this.prop.value;

    //this.value = !this.value;
    this.propHolder.setProperty(this.prop.name, {value: !this.prop.value, exposed: this.prop.getExposed()});
    this.propertyChanged();
    //this.propertyChangeCompleted(evt);

    let action = new PropertyChangeAction(
      null,
      this.prop.name,
      this.propHolder,
      oldValue,
      this.prop.value
    );
    UndoStack.current.push(action);
  }
}
</script>
