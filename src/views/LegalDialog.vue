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
        <h2>Steam ToS rules</h2>
        <h3>Your submission must not violate:</h3>
        <h4>
          <a href="https://store.steampowered.com/subscriber_agreement/"
            >Steam Subscriber Agreement</a
          >
        </h4>
        <h4>
          <a href="https://store.steampowered.com/online_conduct/"
            >Steam Online Conduct</a
          >
        </h4>
        <h4>
          <a
            href="https://support.steampowered.com/kb_article.php?ref=4045-USHJ-3810"
            >Rules and Guidelines For Steam: Discussions, Reviews, and User
            Generated Content</a
          >
        </h4>
        <h4>
          <a
            href="https://support.steampowered.com/kb_article.php?ref=4506-DGHX-5190"
            >Steam Workshop: Artwork guidelines</a
          >
        </h4>
        <p />
        <h2>MEMENGIN Terms of Service and UGC guidelines</h2>
        <h4>
          Your submission must not contain harmful links or message. Even if it
          is embedded in the QR code, it is prohibited.
        </h4>
        <h4>
          Your submission must not contain offensive content. (e.g. racism,
          gore)
        </h4>
        <h4>
          Your submission must not contain pornographic content. (e.g.
          pornographic sprays/decals, nudity)
        </h4>
        <h4>
          You must be the owner of uploaded submission.
        </h4>
        <h4>
          Stolen artwork (even edited) is not allowed
        </h4>
        <p />
        <h2>
          <a href="https://steamcommunity.com/workshop/workshoplegalagreement/">
            You have to agree Steam workshop legal agreement to proceed.
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
      //return TextManager.translate("${legal_dialog.message}");
      return `
        Steam ToS rules Your submission must not violate: Steam Subscriber
        Agreement Steam Online Conduct Rules and Guidelines For Steam:
        Discussions, Reviews, and User Generated Content Steam Workshop Artwork
        guidelines MEMENGIN Terms of Service and UGC guidelines Your submission
        must not contain harmful links or message. Even if it is embedded in the
        QR code, it is prohibited. Your submission must not contain offensive
        content. (e.g. racism, gore) Your submission must not contain
        pornographic content. (e.g. pornographic sprays/decals, nudity) You must
        be the owner of uploaded submission. Stolen artwork (even edited) is not
        allowed`;
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
