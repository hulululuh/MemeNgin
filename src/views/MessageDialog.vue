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
        <v-spacer />
        <v-btn text @click="hide">
          {{ textClose }}
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

  @Component
  export default class MessageDialog extends Vue {
    dialog: boolean = false;
    textTitle: string;
    textMessage: string;
    textClose: string;

    show() {
      this.dialog = true;
    }

    hide() {
      this.dialog = false;
    }
  }
</script>
