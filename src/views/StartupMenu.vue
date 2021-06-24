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
      <v-card-actions class="pa-0 ma-0">
        <v-btn color="primary" dark @click="dialog = false">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
        <v-spacer />
        <v-btn class="mr-1" depressed x-small fab dark @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-actions>

      <v-tabs Left v-model="tabs">
        <v-tab>Home</v-tab>
        <v-tab @click="onPersonalTabSelected">Personal</v-tab>
        <v-tab>Explore</v-tab>
      </v-tabs>
      <v-tabs-items v-model="tabs">
        <v-tab-item eager justify="center" :key="0">
          <home-tab ref="home" />
        </v-tab-item>
        <v-tab-item eager justify="center" :key="1">
          <personal-tab ref="personal" />
        </v-tab-item>
        <v-tab-item eager justify="center" :key="2">
          <explore-tab ref="explore" />
        </v-tab-item>
      </v-tabs-items>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Component } from "vue-property-decorator";
  import { CloudData } from "@/clouddata";
  import HomeTab from "@/views/HomeTab.vue";
  import ExploreTab from "@/views/ExploreTab.vue";
  import PersonalTab from "@/views/PersonalTab.vue";

  @Component({
    components: {
      homeTab: HomeTab,
      personalTab: PersonalTab,
      exploreTab: ExploreTab,
    },
  })
  export default class StartupMenu extends Vue {
    dialog: boolean = false;
    notifications: boolean = false;
    sound: boolean = true;
    widgets: boolean = false;
    tabs: number[] = null;

    opened() {}

    onPersonalTabSelected() {
      CloudData.getInstance().getUserWorks();
    }

    tryClose() {
      if (this.dialog) this.dialog = false;
    }
  }
</script>
