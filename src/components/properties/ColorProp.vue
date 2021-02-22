<template>
  <div class="field">
    <label>{{ prop.displayName }}</label>
    <div>
      <input type="checkbox" id="expose" name="scales" unchecked
        :value="prop.exposed"
        :checked="prop.exposed"
        @input="updateExposed">
      <color-picker :value="prop.value.toHex()" @input="onInput" @change="onValue" />
    </div>
  </div>
</template>

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

  @Prop()
  designer: Designer;

  @Prop()
  propHolder: IPropertyHolder;

  ColorPropertyView() {}

  mounted() {
    this.oldValue = this.prop.value.toHex();
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

  updateExposed(evt) { 
    this.propHolder.setProperty(this.prop.name, {value: this.prop.getValue(), exposed: evt.target.checked});
    this.propertyExposeChanged();
  }

  onInput(value) {
    //console.log(value);
    this.propHolder.setProperty(this.prop.name, {value: value, exposed: this.prop.getExposed()});
    this.propertyChanged();
  }

  onValue(value) {
    this.propHolder.setProperty(this.prop.name, {value: value, exposed: this.prop.getExposed()});

    let action = new PropertyChangeAction(
      null,
      this.prop.name,
      this.propHolder,
      this.oldValue,
      {value: this.prop.getValue(), exposed: this.prop.getExposed()}
    );
    UndoStack.current.push(action);

    this.oldValue = {value: this.prop.getValue(), exposed: this.prop.getExposed()};
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

.color {
  margin-top: 0.4em;
  width: 100%;
  width: calc(100% - 4px - 1px);
  appearance: none;
}

.color::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color::-webkit-color-swatch {
  border: none;
}
</style>
