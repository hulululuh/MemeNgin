<template>
  <v-dialog
    v-model="dialog"
    persistent
    max-width="360"
    @keydown.esc="dialog = false"
  >
    <v-card>
      <v-card-title class="headline grey lighten-2">
        {{ textTitle }}
      </v-card-title>
      <v-card-text>{{ textMessage }}</v-card-text>
      <v-card-actions justify-center>
        <v-spacer></v-spacer>
        <v-btn text @click="onSave">
          {{ textSave }}
        </v-btn>
        <v-btn text @click="onClose">
          {{ textClose }}
        </v-btn>
        <v-btn text @click="onCancel">
          {{ textCancel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { TextManager } from "@/assets/textmanager";
  import { Vue, Component, Emit } from "vue-property-decorator";

  @Component
  export default class CloseDialog extends Vue {
    dialog: boolean = false;

    @Emit()
    onSave() {
      this.dialog = false;
      this.$emit("onSave");
    }

    @Emit()
    onClose() {
      this.dialog = false;
      this.$emit("onClose");
    }

    @Emit()
    onCancel() {
      this.dialog = false;
      this.$emit("onCancel");
    }

    show() {
      this.dialog = true;
    }

    hide() {
      this.dialog = false;
    }

    get textTitle() {
      return TextManager.translate("${close_dialog.title}");
    }

    get textMessage() {
      return TextManager.translate("${close_dialog.message}");
    }

    get textSave() {
      return TextManager.translate("${ui_general.save}");
    }

    get textClose() {
      return TextManager.translate("${ui_general.do_not_save}");
    }

    get textCancel() {
      return TextManager.translate("${ui_general.cancel}");
    }
  }
</script>
