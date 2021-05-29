<template>
  <v-container fluid class="pa-0 ma-0" style="overflow-y: scroll !important;">
    <item-list categoryName="Recent" :lists="recentList" ref="recent" />
    <item-list
      categoryName="Tutorials"
      :lists="tutorialsList"
      ref="tutorials"
    />
    <item-list
      categoryName="Applications"
      :lists="applicationsList"
      ref="applications"
    />
  </v-container>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import ItemList from "@/views/ItemList.vue";
  import { Vue, Component } from "vue-property-decorator";
  import { getAllFiles } from "@/assets/assetmanager";
  import path from "path";
  declare let __static: any;

  @Component({
    components: {
      itemList: ItemList,
    },
  })
  export default class HomeTab extends Vue {
    get recentList() {
      return this.$store.state.userData.recentFiles;
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
