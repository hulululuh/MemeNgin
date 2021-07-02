<template>
  <v-container fill-height>
    <v-layout class="justify-center align-center">
      <v-card block elevation="0" width="64px" height="64px">
        <v-img src="assets/icons/Steam_Logo_Lockups_24dp.svg" />
      </v-card>
      <h1>
        {{ textSteamMustRun }}
      </h1>
    </v-layout>
  </v-container>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Component } from "vue-property-decorator";
  import { TextManager } from "@/assets/textmanager";

  @Component
  export default class SteamMustRun extends Vue {
    get textSteamMustRun() {
      return TextManager.translate("${ui_general.steam_must_run}");
    }
  }
</script>
