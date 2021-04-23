<template>
  <v-container class="field ma-0 pa-0">
    <v-subheader class="ma-0 pa-0">
      <label>{{ prop.displayName }}</label>
    </v-subheader>
    <v-textarea
      v-model="prop.value"
      @input="updateValue"
      auto-grow
      rows="1"
      row-height="15"
    >
      <template v-slot:prepend>
        <v-checkbox
          v-model="prop.exposed"
          @change="updateExposed"
          class="ma-0 pa-0"
          hide-details
        >
        </v-checkbox>
      </template>
    </v-textarea>
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

  @Component
  export default class StringPropertyView extends Vue {
    @Prop()
    // FloatProperty
    prop: any;

    @Prop()
    designer: Designer;

    @Prop()
    propHolder: IPropertyHolder;

    oldValue: any;

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

    focus() {
      this.oldValue = {
        value: this.prop.getValue(),
        exposed: this.prop.getExposed(),
      };
    }

    blur() {
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
</style>
