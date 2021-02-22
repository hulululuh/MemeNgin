<template>
  <div class="field">
    <label>{{ prop.displayName }}</label>
    <div class="input-holder">
      <input type="checkbox" id="expose" name="scales" unchecked
        :value="prop.exposed"
        :checked="prop.exposed"
        @input="updateExposed">
      <button class="bool" @click="toggleValue()">{{ valueText }}</button>
    </div>
  </div>
</template>

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

  updateExposed(evt) { 
    this.propHolder.setProperty(this.prop.name, {value: this.prop.getValue(), exposed: evt.target.checked});
    this.propertyExposeChanged();
  }

  //value: boolean = true;
  get valueText() {
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

.bool {
  margin-top: 0.4em;
  width: 100%;
  border: none;
  border-radius: 2px;
  color: white;
  background: #222;
  padding: 4px;
  outline: none;
}
</style>
