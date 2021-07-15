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
              :deleteAction="cloud"
              ref="searched"
            />
            <item-list
              categoryName="Subscribed"
              :lists="subscribed"
              :deleteAction="unsubscribe"
              ref="searched"
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
  import { Vue, Component } from "vue-property-decorator";
  import ItemList from "@/views/ItemList.vue";
  import SteamMustRun from "@/views/SteamMustRun.vue";
  import { DeleteAction } from "@/views/ProjectItem.vue";

  @Component({
    components: {
      itemList: ItemList,
      steamMustRun: SteamMustRun,
    },
  })
  export default class PersonalTab extends Vue {
    panel: number[] = [0, 1];

    get cloud() {
      return DeleteAction.Cloud;
    }

    get unsubscribe() {
      return DeleteAction.Unsubscribe;
    }

    get initialized() {
      return WorkshopManager.getInstance().initialized;
    }

    get subscribed() {
      return this.$store.state.userData.subscribedItems;
    }

    get userWorks() {
      return this.$store.state.cloudData.userWorks;
    }
  }
</script>
