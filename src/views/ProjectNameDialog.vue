<template>
  <v-dialog
    v-model="dialog"
    persistent
    max-width="360"
    @keydown.esc="dialog = false"
    @keydown.enter="onCreate"
  >
    <v-card>
      <v-card-title class="headline grey lighten-2">
        {{ textTitle }}
      </v-card-title>
      <v-card-text>{{ textMessage }}</v-card-text>
      <v-form
        ref="form"
        lazy-validation
        @submit="submit"
        onSubmit="return false;"
      >
        <v-text-field
          v-model="name"
          ref="title"
          class="pl-5 pr-5"
          required
          :rules="titleRules"
        />
      </v-form>
      <v-card-actions justify-center>
        <v-spacer />
        <v-btn text @click="onCancel">
          {{ textCancel }}
        </v-btn>
        <v-btn text @click="onCreate">
          {{ textCreate }}
        </v-btn>
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
  import { TITLE_RULES } from "@/views/PublishDialog.vue";
  import App from "@/App.vue";

  @Component
  export default class ProjectNameDialog extends Vue {
    dialog: boolean = false;
    name: string = "";

    onCreate() {
      if ((this.$refs.form as Vue & { validate: () => boolean }).validate()) {
        // create an empty project
        let app = this.$root.$children[0] as App;
        app.createProject(this.name);
        this.dialog = false;
      }
    }

    onCancel() {
      this.dialog = false;
    }

    submit() {}

    get titleRules() {
      return TITLE_RULES;
    }

    get textCreate() {
      return TextManager.translate("${ui_general.create}");
    }

    get textCancel() {
      return TextManager.translate("${ui_general.cancel}");
    }

    get textTitle() {
      return TextManager.translate("${new_document_dialog.title}");
    }

    get textMessage() {
      return TextManager.translate("${new_document_dialog.message}");
    }
  }
</script>
