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
      <v-btn class="fg-color-sample"
        v-on:click="toggle"
        v-bind:style="{ background: prop.value.toHex() }" />
    </v-input>
    <v-color-picker
      block
      v-click-outside="blur"
      v-if="isOpen"
      :value="prop.value.toHex()"
      @input="onInput"
      @change="onValue">
    </v-color-picker>
  </v-container>
</template>

<style scoped lang="scss">
@import "../../../public/scss/property.scss";
</style>

<script lang="ts">
// https://codepen.io/Brownsugar/pen/NaGPKy
import { Vue, Prop, Component, Emit } from "vue-property-decorator";
import { Designer } from "@/lib/designer";
import { IPropertyHolder } from "@/lib/designer/properties";
import ColorPicker from "@/components/ColorPicker.vue";
import { PropertyChangeAction } from "@/lib/actions/propertychangeaction";
import { UndoStack } from "@/lib/undostack";

@Component({
  components: {
    ColorPicker,
  },
})
export default class ColorPropertyView extends Vue {
  @Prop()
  // ColorProperty
  prop: any;

  oldValue: any;
  
  open: boolean = false;

  @Prop()
  designer: Designer;

  @Prop()
  propHolder: IPropertyHolder;

  ColorPropertyView() {}

  blur() {
    if (this.open) {
      this.open = false;
    }
    this.UpdateValue();
  }
  
  get isOpen() {
    return this.open;
  }

  toggle() {
    this.open = !this.open;
  }

  mounted() {
    this.open = false;
    this.oldValue = {value: this.prop.value.toHex(), exposed: this.prop.getExposed()};
  }

  @Emit()
  propertyChanged() {
    this.$emit("propertyChanged", this.prop);
    return this.prop.name;
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

  onInput(value) {
    //console.log(value);
    this.propHolder.setProperty(this.prop.name, {value: value, exposed: this.prop.getExposed()});
    this.propertyChanged();
  }

  UpdateValue() {
    const newValue = {value: this.prop.getValue(), exposed: this.prop.getExposed()};

    if(newValue.value != this.oldValue.value || newValue.exposed != this.oldValue.exposed) {
      this.propHolder.setProperty(this.prop.name, newValue);
      let action = new PropertyChangeAction(
        null,
        this.prop.name,
        this.propHolder,
        this.oldValue,
        newValue
      );
      UndoStack.current.push(action);
      this.oldValue = {value: this.prop.getValue(), exposed: this.prop.getExposed()};
    }
  }

  // onInput(evt) {
  // 	this.propHolder.setProperty(this.prop.name, evt.target.value);
  // 	//this.propertyChanged();
  // }

  // onValue(evt) {
  // 	//let oldValue = this.prop.value.toHex();
  // 	this.propHolder.setProperty(this.prop.name, evt.target.value);

  // 	let action = new PropertyChangeAction(
  // 		null,
  // 		this.prop.name,
  // 		this.propHolder,
  // 		this.oldValue,
  // 		this.prop.value.toHex()
  // 	);
  // 	UndoStack.current.push(action);

  // 	console.log(
  // 		"color change: " + this.oldValue + " > " + this.prop.value.toHex()
  // 	);

  // 	this.oldValue = this.prop.value.toHex();

  // 	this.propertyChanged();
  // }
}
</script>
