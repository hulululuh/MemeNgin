<template>
  <v-dialog
    v-model="dialog"
    persistent
    max-width="900px"
    @keydown.esc="dialog = false"
    :scrollable="true"
  >
    <v-card>
      <v-card-title class="text-h5 grey lighten-2">
        {{ textTitle }}
      </v-card-title>
      <v-card-text d-flex>
        {{ textTerms }}
      </v-card-text>
      <v-card-actions flex justify-center>
        <v-btn @click="okay">{{ textOkay }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { TextManager } from "@/assets/textmanager";
  import { Vue, Component } from "vue-property-decorator";

  @Component
  export default class AgeDialog extends Vue {
    dialog: boolean = false;

    get textTitle() {
      return TextManager.translate("${age_dialog.title}");
    }

    get textTerms() {
      return TextManager.translate("${age_dialog.message}");
    }

    get textOkay() {
      return TextManager.translate("${ui_general.okay}");
    }

    okay() {
      this.dialog = false;
    }
  }
</script>
