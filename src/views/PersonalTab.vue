<template>
  <v-container fluid class="pa-0 ma-0">
    <steam-must-run v-if="!initialized" />
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
  import { Vue, Component } from "vue-property-decorator";
  import ItemList from "@/views/ItemList.vue";
  import SteamMustRun from "@/views/SteamMustRun.vue";

  @Component({
    components: {
      itemList: ItemList,
      steamMustRun: SteamMustRun,
    },
  })
  export default class PersonalTab extends Vue {
    panel: number[] = [0, 1];

    get initialized() {
      return WorkshopManager.getInstance().initialized;
    }

    get best() {
      return this.$store.state.userData.bestItems;
    }

    get userWorks() {
      return this.$store.state.cloudData.userWorks;
    }
  }
</script>
