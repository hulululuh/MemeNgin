<template>
  <v-container fluid class="pa-0 ma-0" style="overflow-y: scroll !important;">
    <item-list categoryName="Recent" :lists="this.recentList" />
    <item-list categoryName="Tutorials" :lists="this.tutorialsList" />
    <item-list categoryName="Applications" :lists="this.applicationsList" />
  </v-container>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import ItemList from "@/views/ItemList.vue";
  import { Vue, Prop, Component } from "vue-property-decorator";
  import { getAllFiles } from "@/assets/assetmanager";
  import { UserData } from "@/userdata";
  import path from "path";
  declare let __static: any;

  @Component({
    components: {
      itemList: ItemList,
    },
  })
  export default class HomeTab extends Vue {
    get recentList() {
      const list = UserData.getInstance().recentFiles;
      return list;
    }

    get tutorialsList() {
      const assetRoot = "assets/mmngs/tutorials/";
      const assetPath = path.join(__static, assetRoot);

      let assetFiles = [];
      getAllFiles(assetPath, assetFiles, "*.mmng");

      return assetFiles;
    }

    get applicationsList() {
      const assetRoot = "assets/mmngs/applications/";
      const assetPath = path.join(__static, assetRoot);

      let assetFiles = [];
      getAllFiles(assetPath, assetFiles, "*.mmng");

      return assetFiles;
    }
  }
</script>
