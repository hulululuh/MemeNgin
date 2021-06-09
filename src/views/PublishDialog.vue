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
        Publish your work on steam workshop.
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="8">
            <v-text-field label="Title*" required></v-text-field>
            <v-textarea name="input-5-1" label="Description"></v-textarea>
            <v-select :items="ratings" label="Age rating*" required></v-select>
            <v-autocomplete
              chips
              :items="tags"
              label="Tags"
              multiple
            ></v-autocomplete>
          </v-col>
          <v-col align="center" justify="center" cols="4">
            Thumbnail
            <v-card width="256px">
              <v-img
                class="align-center"
                style="text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;"
                height="256px"
                v-bind:src="img"
                lazy-src="assets/icons/image.svg"
              />
            </v-card>
          </v-col>
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
  import { Vue, Component, Emit, Watch } from "vue-property-decorator";
  import { AGE_RATING, TAGS_TEST } from "@/userdata";
  import { Editor } from "@/lib/editor";
  import { canvasToThumbnailURL } from "@/lib/designer";

  @Component
  export default class PublishDialog extends Vue {
    dialog: boolean = false;
    notifications: boolean = false;
    sound: boolean = true;
    widgets: boolean = false;
    tabs: number[] = null;
    ratings: string[] = AGE_RATING;
    tags: string[] = TAGS_TEST;

    @Emit()
    onCancel() {
      this.dialog = false;
      this.$emit("onCancel");
    }

    tryClose() {
      if (this.dialog) this.dialog = false;
    }

    get img() {
      return this.$store.state.thumbnail;
    }

    show() {
      this.dialog = true;
      this.prepareThumbnail();
    }

    hide() {
      this.dialog = false;
    }

    prepareThumbnail() {
      let outputCanvas = Editor.getScene().outputNode.imageCanvas.canvas;
      this.$store.state.thumbnail = canvasToThumbnailURL(outputCanvas);
    }
  }
</script>
