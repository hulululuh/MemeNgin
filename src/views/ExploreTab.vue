<template>
  <v-container fluid class="pa-0 ma-0" style="overflow-y: scroll !important;">
    <v-btn v-model="showFilter" @click="toggleFilterVisibility">
      <v-img
        style="pa-1 text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;"
        src="assets/icons/filter_alt_black_24dp.svg"
      />
    </v-btn>
    <v-row no-gutters>
      <v-col cols="2" v-if="showFilter" clipped max-width="300">
        <workshop-filter />
      </v-col>
      <v-col cols="10" clipped>
        <item-list categoryName="Searched" :lists="searched" ref="searched" />
        <v-pagination v-model="page" :length="numPages" :total-visible="9" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { WorkshopManager } from "@/community/workshop";
  import ItemList from "@/views/ItemList.vue";
  import WorkshopFilter from "@/views/WorkshopFilter.vue";
  import { Vue, Component } from "vue-property-decorator";

  @Component({
    components: {
      itemList: ItemList,
      workshopFilter: WorkshopFilter,
    },
  })
  export default class HomeTab extends Vue {
    showFilter: boolean = true;

    toggleFilterVisibility() {
      this.showFilter = !this.showFilter;
    }

    get filterWidth() {
      return this.showFilter ? 2 : 0;
    }

    get contentWidth() {
      return this.showFilter ? 10 : 12;
    }

    get searched() {
      return this.$store.state.userData.searchedItems;
    }

    get numPages() {
      return this.$store.state.userData.numSearchResultInPages;
    }

    get page() {
      return this.$store.state.userData.pageIndex;
    }

    set page(value) {
      WorkshopManager.getInstance().requestPage(value);
    }
  }
</script>
