<template>
  <v-dialog
    v-model="dialog"
    persistent
    max-width="900px"
    @keydown.esc="dialog = false"
    :scrollable="true"
    ><v-card>
      <v-card-title class="text-h5 grey lighten-2">
        Terms of the agreement
      </v-card-title>
      <v-card-text d-flex>
        {{ terms }}
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn width="50%" dark @click="agree">Agree</v-btn>
        <v-btn width="50%" @click="disagree">Disagree</v-btn>
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
  export default class LegalDialog extends Vue {
    dialog: boolean = false;
    get terms() {
      return "blah blah";
    }

    agree() {
      this.dialog = false;
    }

    disagree() {
      this.dialog = false;
    }
  }
</script>
