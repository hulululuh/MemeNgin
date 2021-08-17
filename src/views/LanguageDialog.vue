<template>
  <v-dialog
    v-model="dialog"
    persistent
    max-width="800px"
    @keydown.esc="dialog = false"
  >
    <v-card style="overflow-y: hidden !important;">
      <v-card-title class="headline grey lighten-2">
        {{ textTitle }}
      </v-card-title>
      <v-card-actions class="ma-1" justify-center>
        <v-row justify-center>
          <v-col cols="12">
            <v-btn
              width="50%"
              v-for="(item, i) in lang"
              :key="i"
              :disabled="!isAvailable(item)"
              @click="selectLanguage(item)"
              >{{ item["name"] }}</v-btn
            >
          </v-col>
          <v-col cols="12">
            <div>{{ `*${textSaveBefore}` }}</div>
            <div>{{ textHelpTranslate }}</div>
            <h4>
              <a
                href="https://github.com/hulululuh/MemeNginData/blob/main/translations/README.md"
                >{{ textGoHelp }}</a
              >
            </h4>
          </v-col>
          <v-btn class="ma-1" color="grey" width="100%" @click="hide">
            {{ textOkay }}
          </v-btn>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
  .v-btn {
    text-transform: none !important;
  }
</style>

<script lang="ts">
  import { TextManager, LANGUAGES } from "@/assets/textmanager";
  import { Vue, Component } from "vue-property-decorator";
  import { UserData } from "@/userdata";
  import fs from "fs";
  import path from "path";

  declare let __static: any;

  @Component
  export default class LanguageDialog extends Vue {
    dialog: boolean = false;

    show() {
      this.dialog = true;
    }

    hide() {
      this.dialog = false;
    }

    selectLanguage(item) {
      TextManager.getInstance().setLanguage(item["code"]);
      this.hide();
      UserData.deserialize();
      const remote = window.require ? window.require("electron").remote : null;
      remote.getCurrentWindow().reload();
    }

    isAvailable(item) {
      let tsPath = path.join(__static, item["data"]);
      return fs.existsSync(tsPath);
    }

    get textTitle() {
      return TextManager.translate("${ui_general.language}");
    }

    get textOkay() {
      return TextManager.translate("${ui_general.okay}");
    }

    get textSaveBefore() {
      return TextManager.translate("${language_dialog.save_before}");
    }

    get textHelpTranslate() {
      return TextManager.translate("${language_dialog.help_translate}");
    }

    get textGoHelp() {
      return TextManager.translate("${language_dialog.go_help}");
    }

    get lang() {
      let array = [];

      for (let lanId in LANGUAGES) {
        array.push(LANGUAGES[lanId]);
      }
      return array;
    }
  }
</script>
