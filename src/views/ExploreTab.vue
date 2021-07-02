<template>
  <v-container fluid class="pa-0 ma-0">
    <steam-must-run v-if="!initialized" />
    <v-container
      fluid
      v-if="initialized"
      class="pa-0 ma-0"
      style="overflow-y: scroll !important;"
    >
      <v-btn v-model="showFilter" @click="toggleFilterVisibility">
        <v-img
          style="pa-1 text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;"
          src="assets/icons/filter_alt_black_24dp.svg"
        />
      </v-btn>
      <v-row no-gutters fluid>
        <v-scroll-x-transition>
          <v-col cols="2" v-show="showFilter" style="min-width:360px">
            <v-card>
              <v-expansion-panels
                v-model="panel"
                multiple
                accordion
                block
                class="ma-0 pa-0"
              >
                <v-expansion-panel :key="0">
                  <v-expansion-panel-header>{{
                    "Preview"
                  }}</v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <workshop-item />
                  </v-expansion-panel-content>
                </v-expansion-panel>
                <v-expansion-panel :key="1">
                  <v-expansion-panel-header>{{
                    "Filter"
                  }}</v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <workshop-filter />
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card>
          </v-col>
        </v-scroll-x-transition>
        <v-divider vertical />
        <v-col align-content-space-between>
          <v-card fluid clipped class="pa-0 ma-0">
            <explore-item-list
              ref="exploreItemList"
              categoryName="Searched"
              :lists="searched"
            />
            <v-pagination
              bottom
              v-model="page"
              :length="numPages"
              :total-visible="9"
            />
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
  import { WorkshopManager } from "@/community/workshop";
  import { QueryTarget } from "@/userdata";
  import ExploreItemList from "@/views/ExploreItemList.vue";
  import WorkshopFilter from "@/views/WorkshopFilter.vue";
  import WorkshopItem from "@/views/WorkshopItem.vue";
  import SteamMustRun from "@/views/SteamMustRun.vue";
  import { Vue, Component } from "vue-property-decorator";
  import { TextManager } from "@/assets/textmanager";

  @Component({
    components: {
      exploreItemList: ExploreItemList,
      workshopFilter: WorkshopFilter,
      workshopItem: WorkshopItem,
      steamMustRun: SteamMustRun,
    },
  })
  export default class HomeTab extends Vue {
    showFilter: boolean = true;
    panel: number[] = [0, 1];
    index = 1;

    toggleFilterVisibility() {
      this.showFilter = !this.showFilter;
    }

    get selectedItemData() {
      // let index = (this.$refs.exploreItemList as ExploreItemList).selectedItem;
      const item = this.$store.state.userData.searchedItems[0];
      return item ? item : null;
    }

    get initialized() {
      return WorkshopManager.getInstance().initialized;
    }

    get searched() {
      return this.$store.state.userData.searchedItems;
    }

    get numPages() {
      return this.$store.state.userData.numSearchResultInPages;
    }

    get page() {
      return this.index;
    }

    set page(value) {
      this.index = value;
      WorkshopManager.getInstance().requestPage(value, QueryTarget.Search);
    }
  }
</script>
