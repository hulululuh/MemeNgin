<template>
  <v-container class="field ma-0 pa-0">
    <v-subheader class="ma-0 pa-0">
      <label>{{ prop.displayName }}</label>
    </v-subheader>
    <v-input>
      <v-slider
        :snap="true"
        :step="prop.step"
        :max="prop.maxValue"
        :min="prop.minValue"
        :value="prop.value"
        @mouseup="blur"
        @mousedown="focus"
        @input="updateValue"
        hide-details
      >
        <template v-slot:prepend>
          <v-checkbox
            v-model="prop.exposed"
            @change="updateExposed"
            class="ma-0 pa-0"
            hide-details
          />
        </template>
        <template v-slot:append>
          <v-text-field
            class="ma-0 pa-0"
            type="number"
            style="width: 50px"
            :step="prop.step"
            :max="prop.maxValue"
            :min="prop.minValue"
            :value="prop.value.toString()"
            @click="blurText"
            @change="blurText"
            @blur="blurText"
            @focus="focus"
            @input="updateText"
            hide-details
            single-line
          />
        </template>
      </v-slider>
    </v-input>
  </v-container>
</template>

<style scoped lang="scss">
  @import "../../../public/scss/property.scss";
</style>

<script lang="ts">
  import { Vue, Prop, Component, Emit } from "vue-property-decorator";
  import { Designer } from "@/lib/designer";
  import { IPropertyHolder } from "../../lib/designer/properties";
  import { PropertyChangeComplete } from "./ipropertyui";
  import { UndoStack } from "@/lib/undostack";
  import { PropertyChangeAction } from "@/lib/actions/propertychangeaction";

  @Component
  export default class FloatPropertyView extends Vue {
    @Prop()
    // FloatProperty
    prop: any;

    @Prop()
    designer: Designer;

    @Prop()
    propHolder: IPropertyHolder;

    oldValue: any;

    text: string;

    isEditing: boolean;

    mounted() {
      this.isEditing = false;
      this.text = this.prop.value.toString();
      this.oldValue = {
        value: this.prop.getValue(),
        exposed: this.prop.getExposed(),
      };
    }

    @Emit()
    propertyChanged() {
      this.$emit("propertyChanged", this.prop, this.propHolder);
      return this.prop.name;
    }

    @Emit()
    propertyChangeCompleted(evt: PropertyChangeComplete) {
      return evt;
    }

    @Emit()
    propertyExposeChanged() {
      this.$emit("propertyExposeChanged", this.prop, this.propHolder);
      return this.prop.name;
    }

    updateExposed(value) {
      this.propHolder.setProperty(this.prop.name, {
        value: this.prop.getValue(),
        exposed: value,
      });
      this.propertyExposeChanged();
    }

    updateValue(value) {
      this.text = value.toString();
      this.propHolder.setProperty(this.prop.name, {
        value: value,
        exposed: this.prop.getExposed(),
      });
      this.propertyChanged();
    }

    focus() {
      this.oldValue = {
        value: this.prop.getValue(),
        exposed: this.prop.getExposed(),
      };
    }

    blur() {
      if (
        this.oldValue.value != this.prop.value ||
        this.oldValue.exposed != this.prop.exposed
      ) {
        let action = new PropertyChangeAction(
          null,
          this.prop.name,
          this.propHolder,
          this.oldValue,
          { value: this.prop.getValue(), exposed: this.prop.getExposed() }
        );
        UndoStack.current.push(action);
      }
    }

    updateText(value) {
      this.isEditing = true;
      this.text = value;
    }

    blurText() {
      let val = Number.parseFloat(this.text);
      if (typeof val == "number" && val != this.prop.value && this.isEditing) {
        this.oldValue = {
          value: this.prop.getValue(),
          exposed: this.prop.getExposed(),
        };
        this.propHolder.setProperty(this.prop.name, {
          value: val,
          exposed: this.prop.getExposed(),
        });
        this.propertyChanged();

        if (
          this.oldValue.value != this.prop.getValue() ||
          this.oldValue.exposed != this.prop.getExposed()
        ) {
          let action = new PropertyChangeAction(
            null,
            this.prop.name,
            this.propHolder,
            this.oldValue,
            { value: this.prop.getValue(), exposed: this.prop.getExposed() }
          );
          UndoStack.current.push(action);
          this.isEditing = false;
        }
      }
    }
  }
</script>
