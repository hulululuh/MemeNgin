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
        <v-spacer class="ma-2" />
        <h2>{{ textSteamToS }}</h2>
        <h3>{{ textSteamToSMustNot }}</h3>
        <h4>
          <a href="https://store.steampowered.com/subscriber_agreement/">{{
            textSteamToSSubscriber
          }}</a>
        </h4>
        <h4>
          <a href="https://store.steampowered.com/online_conduct/">{{
            textSteamToSConduct
          }}</a>
        </h4>
        <h4>
          <a
            href="https://support.steampowered.com/kb_article.php?ref=4045-USHJ-3810"
            >{{ textSteamToSRules }}</a
          >
        </h4>
        <h4>
          <a
            href="https://support.steampowered.com/kb_article.php?ref=4506-DGHX-5190"
            >{{ textSteamToSArtwork }}</a
          >
        </h4>
        <p />
        <h2>{{ textMmngToS }}</h2>
        <h3>
          {{ textMmngToSMustNot }}
        </h3>
        <h4>
          {{ textMmngToSHarmful }}
        </h4>
        <h4>
          {{ textMmngToSOffensive }}
        </h4>
        <h4>
          {{ textMmngToSPornographic }}
        </h4>
        <h3>
          {{ textMmngToSMustOwner }}
        </h3>
        <h4>
          {{ textMmngToSStolen }}
        </h4>
        <p />
        <h2>
          <a href="https://steamcommunity.com/workshop/workshoplegalagreement/">
            {{ textAgreeLegal }}
          </a>
        </h2>
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
  h2 {
    text-indent: 0px;
  }
  h3 {
    text-indent: 15px;
  }
  h4 {
    text-indent: 30px;
  }
  h5 {
    text-indent: 45px;
  }
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

    get textSteamToS() {
      return TextManager.translate("${legal_dialog.steam_tos.title}");
    }

    get textSteamToSMustNot() {
      return TextManager.translate("${legal_dialog.steam_tos.must_not}");
    }

    get textSteamToSSubscriber() {
      return TextManager.translate(
        "${legal_dialog.steam_tos.subscriber_agreement}"
      );
    }

    get textSteamToSConduct() {
      return TextManager.translate("${legal_dialog.steam_tos.online_conduct}");
    }

    get textSteamToSRules() {
      return TextManager.translate("${legal_dialog.steam_tos.rules}");
    }

    get textSteamToSArtwork() {
      return TextManager.translate("${legal_dialog.steam_tos.artwork}");
    }

    get textMmngToS() {
      return TextManager.translate("${legal_dialog.mmng_tos.title}");
    }

    get textMmngToSMustNot() {
      return TextManager.translate("${legal_dialog.mmng_tos.must_not}");
    }

    get textMmngToSHarmful() {
      return TextManager.translate("${legal_dialog.mmng_tos.harmful}");
    }

    get textMmngToSOffensive() {
      return TextManager.translate("${legal_dialog.mmng_tos.offensive}");
    }

    get textMmngToSPornographic() {
      return TextManager.translate("${legal_dialog.mmng_tos.pornographic}");
    }

    get textMmngToSMustOwner() {
      return TextManager.translate("${legal_dialog.mmng_tos.must_owner}");
    }

    get textMmngToSStolen() {
      return TextManager.translate("${legal_dialog.mmng_tos.stolen}");
    }

    get textAgreeLegal() {
      return TextManager.translate("${legal_dialog.agree_legal}");
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
