<template>
  <v-container fluid class="pa-0 ma-0">
    <v-container fluid class="pa-0 ma-0" v-if="!initialized">
      Steam needs to be initialized!!!
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
            <item-list categoryName="Best" :lists="best" ref="searched" />
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
  import { WorkshopManager } from "@/community/workshop";
  import { QueryTarget } from "@/userdata";
  import ItemList from "@/views/ItemList.vue";
  import WorkshopFilter from "@/views/WorkshopFilter.vue";
  import { Vue, Component } from "vue-property-decorator";

  @Component({
    components: {
      itemList: ItemList,
      workshopFilter: WorkshopFilter,
    },
  })
  export default class PersonalTab extends Vue {
    showFilter: boolean = true;
    panel: number[] = [0, 1];

    toggleFilterVisibility() {
      this.showFilter = !this.showFilter;
    }

    get initialized() {
      return WorkshopManager.getInstance().initialized;
    }

    get best() {
      return this.$store.state.userData.bestItems;
    }
  }
</script>
