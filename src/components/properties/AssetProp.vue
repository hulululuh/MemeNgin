<template>
  <v-container class="field ma-0 pa-0">
    <font-info-dialog ref="fontInfoDialog" />
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
        :key="selected"
        :items="prop.values"
        @change="updateValue"
        dense
      >
        <template v-slot:item="{ item }" :active="false">
          <font-item :id="item" />
        </template>
        <template v-slot:selection="{ item }">
          <font-item :id="item" />
        </template>
      </v-select>

      <template>
        <v-btn
          class="mx-2"
          fab
          dark
          x-small
          color="primary"
          @click="showFontInfoDialog"
          max-height="24px"
          max-width="24px"
        >
          <v-icon dark>
            mdi-help
          </v-icon>
        </v-btn>
      </template>
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
  import PropertyName from "@/components/properties/PropertyName.vue";
  import FontItem from "@/components/FontItem.vue";
  import FontInfoDialog from "@/views/FontInfoDialog.vue";

  @Component({
    components: {
      propertyName: PropertyName,
      fontItem: FontItem,
      fontInfoDialog: FontInfoDialog,
    },
  })
  export default class AssetPropertyView extends Vue {
    @Prop()
    // AssetProperty
    prop: any;
    //selected: any;

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
    propertyExposeChanged() {
      this.$emit("propertyExposeChanged", this.prop, this.propHolder);
      return this.prop.name;
    }

    get selectedItem() {
      return this.prop.getValue();
    }

    get selected() {
      return this.prop.getValue();
    }

    set selected(val) {}

    showFontInfoDialog() {
      (this.$refs.fontInfoDialog as FontInfoDialog).dialog = true;
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
