<template>
  <v-dialog v-model="dialog" fullscreen transition="dialog-bottom-transition">
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        color="primary"
        dark
        v-bind="attrs"
        v-on="on"
        class="system-bar-button"
        @click="opened"
      >
        <v-icon>mdi-menu</v-icon>
      </v-btn>
    </template>

    <v-card>
      <v-btn color="primary" dark @click="dialog = false">
        <v-icon>mdi-menu</v-icon>
      </v-btn>
      <v-tabs Left>
        <v-tab>Home</v-tab>
        <v-tab>Personalized</v-tab>
        <v-tab>Explore</v-tab>
        <v-tab-item justify="center">
          <home-tab ref="home" />
        </v-tab-item>
      </v-tabs>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Component } from "vue-property-decorator";
  import HomeTab from "@/views/HomeTab.vue";
  // import ExploreTab from "@/views/ExploreTab.vue";
  // import WorkshopTab from "@/views/WorkshopTab.vue";

  @Component({
    components: {
      homeTab: HomeTab,
      // exploreTab: ExploreTab,
      // workshopTab: WorkshopTab,
    },
  })
  export default class StartupMenu extends Vue {
    dialog: boolean = false;
    notifications: boolean = false;
    sound: boolean = true;
    widgets: boolean = false;

    opened() {}

    tryClose() {
      if (this.dialog) this.dialog = false;
    }
  }
</script>
