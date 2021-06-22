<template>
  <v-dialog
    v-model="dialog"
    persistent
    max-width="900px"
    @keydown.esc="dialog = false"
    :scrollable="true"
    ><v-card>
      <v-card-title class="text-h5 grey lighten-2">
        {{ textTitle }}
      </v-card-title>
      <v-card-text d-flex>
        {{ textTerms }}
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn width="50%" color="primary" dark @click="agree">{{
          textAgree
        }}</v-btn>
        <v-btn width="50%" @click="disagree">{{ textDisagree }}</v-btn>
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
  export default class LegalDialog extends Vue {
    dialog: boolean = false;
    get textTitle() {
      return TextManager.translate("${legal_dialog.title}");
    }

    get textTerms() {
      return TextManager.translate("${legal_dialog.message}");
    }

    get textAgree() {
      return TextManager.translate("${ui_general.agree}");
    }

    get textDisagree() {
      return TextManager.translate("${ui_general.disagree}");
    }

    agree() {
      this.$store.state.userData.agreed = true;
      this.dialog = false;
    }

    disagree() {
      this.$store.state.userData.agreed = false;
      this.dialog = false;
    }
  }
</script>
