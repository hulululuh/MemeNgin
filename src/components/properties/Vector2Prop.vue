<template>
  <v-container class="field ma-0 pa-0">
    <v-subheader class="ma-0 pa-0">
      {{ prop.displayName }}
    </v-subheader>

    <v-input>
      <v-checkbox
        v-model="prop.exposed"
        @change="updateExposed"
        class="ma-0 pa-0"
        type="number"
        hide-details
      />
      <v-col class="ma-0 pa-0" md="5">
        <v-text-field
          class=" ma-0 pa-0"
          step="0.001"
          reverse
          :value="parseFloat(prop.value[0]).toFixed(3)"
          @input="onInputX"
          @blur="blur"
          @change="blur"
          @focus="focus"
          hide-details
        >
          <template v-slot:prepend class="ma-0 pa-0">
            x:
          </template>
        </v-text-field>
      </v-col>
      <v-col class="ma-0 pa-0" md="5">
        <v-text-field
          class="ma-0 pa-0"
          step="0.001"
          reverse
          :value="parseFloat(prop.value[1]).toFixed(3)"
          @input="onInputY"
          @blur="blur"
          @change="blur"
          hide-details
        >
          <template v-slot:prepend class="ma-0 pa-0">
            y:
          </template>
        </v-text-field>
      </v-col>
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
  import { Vector2 } from "@math.gl/core";

  @Component
  export default class Vector2PropertyView extends Vue {
    @Prop()
    // FloatProperty
    prop: any;

    @Prop()
    designer: Designer;

    @Prop()
    propHolder: IPropertyHolder;

    oldValue: any;

    valX: number;
    valY: number;

    mounted() {
      const value = this.prop.getValue();
      this.valX = value[0];
      this.valY = value[1];
      this.oldValue = {
        value: new Vector2(this.valX, this.valY),
        exposed: this.prop.getExposed(),
      };
    }

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
      this.propHolder.setProperty(this.prop.name, {
        value: this.prop.getValue(),
        exposed: value,
      });
      this.propertyExposeChanged();
    }

    updateValue(value) {
      this.propHolder.setProperty(this.prop.name, {
        value: value,
        exposed: this.prop.getExposed(),
      });
      this.propertyChanged();
    }

    onInputX(value) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        this.valX = parsed;
      }
    }

    onInputY(value) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        this.valY = parsed;
      }
    }

    focus() {
      this.oldValue = {
        value: this.prop.getValue(),
        exposed: this.prop.getExposed(),
      };
    }

    blur() {
      let value = new Vector2(this.valX, this.valY);

      if (!value.equals(this.prop.getValue())) {
        this.propHolder.setProperty(this.prop.name, {
          value: value,
          exposed: this.prop.getExposed(),
        });
        this.propertyChanged();

        let action = new PropertyChangeAction(
          null,
          this.prop.name,
          this.propHolder,
          this.oldValue,
          { value: this.prop.getValue(), exposed: this.prop.getExposed() }
        );
        UndoStack.current.push(action);
      }

      this.oldValue = {
        value: this.prop.getValue(),
        exposed: this.prop.getExposed(),
      };
    }

    blurText() {
      //   if (typeof val == "number" && val != this.prop.value) {
      //     this.oldValue = {
      //       value: this.prop.getValue(),
      //       exposed: this.prop.getExposed(),
      //     };
      //     this.propHolder.setProperty(this.prop.name, {
      //       value: val,
      //       exposed: this.prop.getExposed(),
      //     });
      //     this.propertyChanged();
      //     if (
      //       this.oldValue.value != this.prop.getValue() ||
      //       this.oldValue.exposed != this.prop.getExposed()
      //     ) {
      //       let action = new PropertyChangeAction(
      //         null,
      //         this.prop.name,
      //         this.propHolder,
      //         this.oldValue,
      //         { value: this.prop.getValue(), exposed: this.prop.getExposed() }
      //       );
      //       UndoStack.current.push(action);
      //     }
      //   }
      // }
    }
  }
</script>
