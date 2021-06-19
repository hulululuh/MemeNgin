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
        About age rating
      </v-card-title>
      <v-card-text d-flex>
        {{ terms }}
      </v-card-text>
      <v-card-actions flex justify-center>
        <v-btn @click="okay">Okay</v-btn>
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
  export default class AgeDialog extends Vue {
    dialog: boolean = false;
    get terms() {
      return "blah blah";
    }

    okay() {
      this.dialog = false;
    }
  }
</script>
