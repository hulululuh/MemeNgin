<template>
  <v-flex>
    <v-img v-if="!isSystemFont" :src="icon" max-height="48" max-width="192" />
    <div v-if="isSystemFont">{{ icon }}</div>
  </v-flex>
</template>

<style scoped lang="scss">
  @import "../../public/scss/property.scss";
</style>

<script lang="ts">
  import { Vue, Component, Prop } from "vue-property-decorator";
  import { AssetManager, AssetType } from "@/assets/assetmanager";
  import path from "path";

  @Component({})
  export default class FontItem extends Vue {
    @Prop()
    id: string;
    icon: string = "";
    isSystemFont: boolean = false;

    created() {
      this.icon = this.iconPath(this.id);

      if (!this.icon) {
        this.isSystemFont = true;
        this.icon = path.parse(this.id).name;
      }
    }

    iconPath(id) {
      let asset = AssetManager.getInstance().getAssetById(id, AssetType.Font);
      if (asset) {
        return asset.iconPath;
      }
      return "";
    }
  }
</script>
