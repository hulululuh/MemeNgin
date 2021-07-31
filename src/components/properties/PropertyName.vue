<template>
  <v-hover v-slot="{ hover }">
    <v-text-field
      class="mt-5 ml-0 pa-0 propertyName custom"
      v-model="name_"
      flat
      solo
      dense
      background-color="#0000"
      :append-icon="isEditingName ? 'mdi-close' : undefined"
      :append-outer-icon="
        isEditingName
          ? 'mdi-check-bold'
          : hover
          ? 'mdi-pencil-outline'
          : undefined
      "
      :readonly="!isEditingName"
      :rules="propertyNameRules"
      :maxlength="25"
      @click:append="
        isEditingName = false;
        onCancel();
      "
      @click:append-outer="
        if (name.length > 0) {
          isEditingName = !isEditingName;
          onApply();
        }
      "
      @keydown.enter="
        if (name.length > 0 && isEditingName) {
          isEditingName = !isEditingName;
          onApply();
        }
      "
      @keydown.esc="
        if (isEditingName) {
          isEditingName = false;
          onCancel();
        }
      "
    />
  </v-hover>
</template>

<style scoped lang="scss">
  @import "../../../public/scss/property.scss";
</style>

<script lang="ts">
  // [GPLv3] created 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)

  import { Vue, Prop, Component, Emit } from "vue-property-decorator";
  import { PROPERTY_NAME_RULES } from "../../lib/designer/properties";

  @Component
  export default class PropertyName extends Vue {
    isEditingName: boolean = false;
    name_: string = "value";

    get name() {
      return this.name_;
    }

    set name(val) {
      this.name_ = val;
    }

    @Emit()
    onCancel() {
      this.$emit("onCancel");
    }

    @Emit()
    onApply() {
      this.$emit("onApply");
    }

    get propertyNameRules() {
      return PROPERTY_NAME_RULES;
    }
  }
</script>
