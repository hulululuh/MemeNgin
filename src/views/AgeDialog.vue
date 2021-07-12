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
      <v-card-text class="age-explain" d-flex>
        {{ textTerms }}
        <v-row no-gutters>
          <v-col cols="3"
            ><v-card bright color="#00F5AF" class="agebar rounded-0">
              <v-card-title class="age-ratring mb-1">
                {{ textEveryone }}
              </v-card-title>
            </v-card></v-col
          >
          <v-col cols="3"
            ><v-card bright color="#D8F1A0" class="agebar rounded-0">
              <v-card-title class="age-ratring mb-1">
                {{ textQuestionable }}
              </v-card-title>
            </v-card></v-col
          >
          <v-col cols="3"
            ><v-card bright color="#F3C178" class="agebar rounded-0">
              <v-card-title class="age-ratring mb-1">
                {{ textMature }}
              </v-card-title>
            </v-card></v-col
          >
          <v-col cols="3"
            ><v-card bright color="#FE5E41" class="agebar rounded-0">
              <v-card-title class="age-ratring mb-1">
                {{ textBan }}
              </v-card-title>
            </v-card></v-col
          >
          <v-col class="age-explain" cols="3">{{ textEveryoneDesc }}</v-col>
          <v-col class="age-explain" cols="3">{{ textQuestionableDesc }}</v-col>
          <v-col class="age-explain" cols="3">{{ textMatureDesc }}</v-col>
          <v-col class="age-explain" cols="3">{{ textBanDesc }}</v-col>
        </v-row>
      </v-card-text>
      <v-card-actions
        flex
        justify-center
        style="
    align-content: center;
    justify-content: center;"
      >
        <v-btn width="150px" @click="okay">{{ textOkay }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";

  .age-explain {
    padding: 5px;
    font-size: 14px;
    font-weight: bold;
  }

  .age-ratring {
    font-size: 18px;
  }

  .agebar {
    font-size: x-large;
    align-content: center;
    justify-content: center;
    height: 240px;
    max-height: 60px;
  }
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

    get textEveryone() {
      return TextManager.translate("${age_dialog.everyone}");
    }
    get textEveryoneDesc() {
      return TextManager.translate("${age_dialog.everyone_desc}");
    }
    get textQuestionable() {
      return TextManager.translate("${age_dialog.questionable}");
    }
    get textQuestionableDesc() {
      return TextManager.translate("${age_dialog.questionable_desc}");
    }
    get textMature() {
      return TextManager.translate("${age_dialog.mature}");
    }
    get textMatureDesc() {
      return TextManager.translate("${age_dialog.mature_desc}");
    }
    get textBan() {
      return TextManager.translate("${age_dialog.ban}");
    }
    get textBanDesc() {
      return TextManager.translate("${age_dialog.ban_desc}");
    }

    okay() {
      this.dialog = false;
    }
  }
</script>
