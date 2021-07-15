<template>
  <v-container fluid class="pa-0 ma-0" style="overflow-y: scroll !important;">
    <item-list
      categoryName="Recent"
      :lists="recentList"
      :deleteAction="unlist"
      ref="recent"
    />
    <item-list
      categoryName="Tutorials"
      :lists="tutorialsList"
      :deleteAction="none"
      ref="tutorials"
    />
    <item-list
      categoryName="Applications"
      :lists="applicationsList"
      :deleteAction="none"
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
  import { ProjectItemData } from "@/community/ProjectItemData";
  import { DeleteAction } from "@/views/ProjectItem.vue";
  declare let __static: any;

  @Component({
    components: {
      itemList: ItemList,
    },
  })
  export default class HomeTab extends Vue {
    get unlist() {
      return DeleteAction.Unlist;
    }

    get none() {
      return DeleteAction.None;
    }

    get recentList() {
      return this.$store.state.userData.recentItems;
    }

    get tutorialsList() {
      const assetRoot = "assets/mmngs/tutorials/";
      const assetPath = path.join(__static, assetRoot);

      let assetFiles = [];
      getAllFiles(assetPath, assetFiles, "*.mmng");

      let items: ProjectItemData[] = [];
      for (let path of assetFiles) {
        let item = ProjectItemData.fromLocalPath(path);
        if (item) items.push(item);
      }

      return items;
    }

    get applicationsList() {
      const assetRoot = "assets/mmngs/applications/";
      const assetPath = path.join(__static, assetRoot);

      let assetFiles = [];
      getAllFiles(assetPath, assetFiles, "*.mmng");

      let items: ProjectItemData[] = [];
      let idx = 0;
      for (let path of assetFiles) {
        let item = ProjectItemData.fromLocalPath(path);
        if (item) items.push(item);
      }

      return items;
    }
  }
</script>
