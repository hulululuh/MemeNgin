<template>
  <v-dialog v-model="dialog" persistent max-width="290">
    <v-card>
      <v-card-title class="headline grey lighten-2">
        MemeNgin
      </v-card-title>
      <v-card-text>{{ textMessage }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="onSave">
          {{ textSave }}
        </v-btn>
        <v-btn text @click="onClose">
          {{ textClose }}
        </v-btn>
        <v-btn text @click="dialog = false">
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

    get textMessage() {
      return TextManager.translate("${close_dialog.message}");
    }

    get textSave() {
      return TextManager.translate("${close_dialog.save}");
    }

    get textClose() {
      return TextManager.translate("${close_dialog.close}");
    }

    get textCancel() {
      return TextManager.translate("${close_dialog.cancel}");
    }
  }
</script>
