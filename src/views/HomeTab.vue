<template>
  <v-container fluid class="pa-0 ma-0" style="overflow-y: scroll !important;">
    <item-list categoryName="Recent" :lists="this.recentList" ref="recent" />
    <item-list
      categoryName="Tutorials"
      :lists="this.tutorialsList"
      ref="tutorials"
    />
    <item-list
      categoryName="Applications"
      :lists="this.applicationsList"
      ref="applications"
    />
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
    private dirtyRecent: boolean = false;
    private dirtyTutorials: boolean = false;
    private dirtyApplications: boolean = false;

    refresh() {
      if (this.dirtyRecent) {
        (this.$refs
          .recent as ItemList).lists = UserData.getInstance().recentFiles;
        this.dirtyRecent = false;
      }
      if (this.dirtyTutorials) {
        (this.$refs.tutorials as ItemList).lists = this.tutorialsList;
        this.dirtyTutorials = false;
      }
      if (this.dirtyApplications) {
        (this.$refs.applications as ItemList).lists = this.applicationsList;
        this.dirtyApplications = false;
      }
    }

    refreshRecent() {
      this.dirtyRecent = true;
    }
    refreshTutorials() {
      this.dirtyTutorials = true;
    }
    refreshApplications() {
      this.dirtyApplications = true;
    }

    get recentList() {
      return UserData.getInstance().recentFiles;
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
