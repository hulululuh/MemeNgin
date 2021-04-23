<template>
  <v-container class="field ma-0 pa-0">
    <v-subheader class="ma-0 pa-0">
      <label>{{ prop.displayName }}</label>
    </v-subheader>
    <v-input class="ma-0 pa-0" hide-details>
      <template v-slot:prepend>
        <v-checkbox
          disabled
          v-model="prop.exposed"
          @change="updateExposed"
          class="ma-0 pa-0"
          hide-details
        >
        </v-checkbox>
      </template>
      <v-select
        v-model="selected"
        :items="prop.values"
        @change="updateValue"
        dense
      >
        <template v-slot:item="{ item }" :active="false">
          <v-img :src="iconPath(item)" max-height="48" max-width="192" />
        </template>
        <template v-slot:selection="{ item }">
          <v-img :src="iconPath(item)" max-height="48" max-width="192" />
        </template>
      </v-select>
    </v-input>
  </v-container>
</template>

<style scoped lang="scss">
  @import "../../../public/scss/property.scss";
</style>

<script lang="ts">
  import { Vue, Prop, Component, Emit } from "vue-property-decorator";
  import { Designer } from "@/lib/designer";
  import { IPropertyHolder } from "@/lib/designer/properties";
  import { PropertyChangeAction } from "@/lib/actions/propertychangeaction";
  import { UndoStack } from "@/lib/undostack";
  import { AssetManager } from "@/assets/assetmanager";

  @Component
  export default class AssetPropertyView extends Vue {
    @Prop()
    // AssetProperty
    prop: any;
    selected: any;

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
    propertyExposeChanged() {
      this.$emit("propertyExposeChanged", this.prop);
      return this.prop.name;
    }

    created() {
      this.selected = this.prop.getValue();
    }

    updateExposed(value) {
      this.propHolder.setProperty(this.prop.name, {
        value: this.prop.getValue(),
        exposed: value,
      });
      this.propertyExposeChanged();
    }

    updateValue(value) {
      let oldVal = { value: value, exposed: this.prop.getExposed() };
      this.propHolder.setProperty(this.prop.name, {
        value: value,
        exposed: this.prop.getExposed(),
      });
      this.propertyChanged();

      let action = new PropertyChangeAction(
        null,
        this.prop.name,
        this.propHolder,
        oldVal,
        { value: this.prop.getValue(), exposed: this.prop.getExposed() }
      );
      UndoStack.current.push(action);
    }

    iconPath(id) {
      let asset = AssetManager.getInstance().getAssetById(
        id,
        this.prop.assetType
      );
      if (asset) {
        return asset.iconPath;
      }
      return "";
    }
  }
</script>
