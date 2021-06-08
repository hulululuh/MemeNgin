<template>
  <v-dialog v-model="dialog" persistent max-width="800px" max-height="800px">
    <v-card>
      <v-card-title class="text-h5 grey lighten-2">
        Publish your work on steam workshop.
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-text-field label="Title*" required></v-text-field>
        </v-row>
        <v-row>
          <v-textarea name="input-7-1" label="Description"></v-textarea>
        </v-row>
        <v-row>
          <v-select
            :items="['0-17', '18-29', '30-54', '54+']"
            label="Age*"
            required
          ></v-select>
        </v-row>
        <v-row>
          <v-autocomplete
            :items="[
              'Skiing',
              'Ice hockey',
              'Soccer',
              'Basketball',
              'Hockey',
              'Reading',
              'Writing',
              'Coding',
              'Basejump',
            ]"
            label="Interests"
            multiple
          ></v-autocomplete>
        </v-row>
        <small>*indicates required field</small>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="onCancel">
          Close
        </v-btn>
        <v-btn color="blue darken-1" text @click="dialog = false">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Component, Emit } from "vue-property-decorator";

  @Component
  export default class PublishDialog extends Vue {
    dialog: boolean = false;
    notifications: boolean = false;
    sound: boolean = true;
    widgets: boolean = false;
    tabs: number[] = null;

    opened() {}

    @Emit()
    onCancel() {
      this.dialog = false;
      this.$emit("onCancel");
    }

    tryClose() {
      if (this.dialog) this.dialog = false;
    }
  }
</script>
