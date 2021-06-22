<template>
  <v-container fluid class="pa-0 ma-0">
    <v-container fluid class="pa-0 ma-0" v-if="!initialized">
      {{ steamMustRun }}
    </v-container>
    <v-container
      fluid
      v-if="initialized"
      class="pa-0 ma-0"
      style="overflow-y: scroll !important;"
    >
      <v-row no-gutters fluid>
        <v-col align-content-space-between>
          <v-card fluid clipped class="pa-0 ma-0">
            <item-list
              categoryName="Your works"
              :lists="userWorks"
              :newDocument="true"
              ref="searched"
            />
            <item-list categoryName="Subscribed" :lists="best" ref="searched" />
            <!-- <v-pagination
              bottom
              v-model="page"
              :length="numPages"
              :total-visible="9"
            /> -->
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { ProjectItemData } from "@/community/ProjectItemData";
  import { WorkshopManager } from "@/community/workshop";
  import { Vue, Component } from "vue-property-decorator";
  import { TextManager } from "@/assets/textmanager";
  import ItemList from "@/views/ItemList.vue";

  @Component({
    components: {
      itemList: ItemList,
    },
  })
  export default class PersonalTab extends Vue {
    panel: number[] = [0, 1];
    userWorks = [];

    get initialized() {
      return WorkshopManager.getInstance().initialized;
    }

    get best() {
      return this.$store.state.userData.bestItems;
    }

    get steamMustRun() {
      return TextManager.translate("${ui_general.steam_must_run}");
    }

    async getUserWorks() {
      const cloudFiles = WorkshopManager.getInstance().UserWorks;
      let items = [];

      for (let file of cloudFiles) {
        let item = await ProjectItemData.fromCloud(file);
        items.push(item);
      }
      this.userWorks = items;
    }
  }
</script>
