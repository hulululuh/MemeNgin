<template>
  <v-container class="field ma-0 pa-0">
    <v-subheader class="ma-0 pa-0">
      <property-name
        ref="propertyName"
        @onApply="onApply"
        @onCancel="onCancel"
      />
    </v-subheader>
    <v-input class="ma-0 pa-0" hide-details>
      <template v-slot:prepend>
        <v-checkbox
          v-model="prop.exposed"
          @change="updateExposed"
          class="ma-0 pa-0"
          hide-details
        >
        </v-checkbox>
      </template>
      <v-btn v-model="prop.value" @click="toggleValue" block>
        {{ valueText }}
      </v-btn>
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
  import { PropertyChangeAction } from "@/lib/actions/propertychangeaction";
  import { UndoStack } from "@/lib/undostack";
  import PropertyName from "@/components/properties/PropertyName.vue";

  @Component({
    components: {
      propertyName: PropertyName,
    },
  })
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

    mounted() {
      this.propertyName.name = this.prop.displayName;
    }

    get propertyName() {
      return this.$refs.propertyName as PropertyName;
    }

    onApply() {
      this.prop.displayName = this.propertyName.name;
    }

    onCancel() {
      this.propertyName.name = this.prop.displayName;
    }

    get valueText(): string {
      return this.prop.value ? "True" : "False";
    }

    toggleValue() {
      const oldValue = this.prop.value;
      const newValue = !this.prop.value;

      this.propHolder.setProperty(this.prop.name, {
        value: newValue,
        exposed: this.prop.getExposed(),
      });
      this.propertyChanged();

      let action = new PropertyChangeAction(
        null,
        this.prop.name,
        this.propHolder,
        { value: oldValue, exposed: this.prop.getExposed() },
        { value: newValue, exposed: this.prop.getExposed() }
      );
      UndoStack.current.push(action);
    }
  }
</script>
