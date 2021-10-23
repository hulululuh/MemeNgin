<template>
  <v-dialog
    v-model="dialog"
    persistent
    max-width="960px"
    max-height="800px"
    @keydown.esc="dialog = false"
  >
    <v-card>
      <v-card-title class="text-h5 grey lighten-2">
        {{ textTitle }}
      </v-card-title>
      <v-card-text>
        <v-row class="ma-1">
          <v-col cols="6">
            <v-img src="assets/tutorials/fonts.png" />
          </v-col>
          <v-col>
            <h3>
              {{ textTitleBuiltIn }}
            </h3>
            {{ textBuiltIn }}
            <p />
            <h3>
              {{ textTitleSystem }}
            </h3>
            {{ textSystem }}
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-row>
          <v-col cols="12" justify-center>
            <v-btn class="ma-1" color="grey" width="100%" @click="hide">
              {{ textDone }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Component } from "vue-property-decorator";
  import { TextManager } from "@/assets/textmanager";

  @Component
  export default class FontInfoDialog extends Vue {
    dialog: boolean = false;

    get textTitle(): string {
      return TextManager.translate("${font_dialog.title}");
    }

    get textTitleBuiltIn(): string {
      return TextManager.translate("${ui_general.built_in_fonts}");
    }

    get textTitleSystem(): string {
      return TextManager.translate("${ui_general.system_fonts}");
    }

    get textBuiltIn(): string {
      return TextManager.translate("${font_dialog.built_in}");
    }

    get textSystem(): string {
      return TextManager.translate("${font_dialog.system}");
    }

    get textDone(): string {
      return TextManager.translate("${ui_general.okay}");
    }

    show() {
      this.dialog = true;
    }

    hide() {
      this.dialog = false;
    }
  }
</script>
