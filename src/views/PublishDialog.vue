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
            <v-form ref="form" lazy-validation>
              <v-text-field
                v-model="title"
                label="Title*"
                required
                :rules="titleRules"
              ></v-text-field>
              <v-textarea
                v-model="description"
                name="input-5-1"
                label="Description"
              ></v-textarea>
              <v-select
                v-model="ageRating"
                :items="ratings"
                label="Age rating*"
                required
                :rules="ageRatingRules"
              ></v-select>
              <v-autocomplete
                v-model="selectedTags"
                chips
                :items="tags"
                label="Tags"
                multiple
              />
              <v-checkbox
                v-model="allowDerivativeWork"
                class="ma-0 pa-0"
                :label="
                  `Allow others to make derivative work from this publication.`
                "
              />
            </v-form>
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
        <v-btn
          v-show="isUpdatable"
          color="blue darken-1"
          text
          @click="dialog = false"
        >
          Update
        </v-btn>
        <v-btn
          v-show="isPublishable"
          color="blue darken-1"
          text
          @click="onPublish"
        >
          Publish
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
  import { AGE_RATING, TAGS_TEST } from "@/userdata";
  import { Editor } from "@/lib/editor";
  import { canvasToThumbnailURL } from "@/lib/designer";
  import { WorkshopManager } from "@/community/workshop";

  @Component
  export default class PublishDialog extends Vue {
    dialog: boolean = false;
    notifications: boolean = false;
    sound: boolean = true;
    widgets: boolean = false;
    tabs: number[] = null;
    ratings: string[] = AGE_RATING;
    tags: string[] = TAGS_TEST;

    key: number = 0;

    @Emit()
    onCancel() {
      this.dialog = false;
      this.$emit("onCancel");
    }

    onPublish() {
      // following line looks too complex, but it is a walkaround for error.
      // https://stackoverflow.com/questions/52109471/typescript-in-vue-property-validate-does-not-exist-on-type-vue-element
      if ((this.$refs.form as Vue & { validate: () => boolean }).validate()) {
        this.dialog = false;
      }
    }

    tryClose() {
      if (this.dialog) this.dialog = false;
    }

    titleRules = [
      (v) => !!v || "Name is required",
      (v) => (v && v.length <= 25) || "Name must be less than 25 characters",
    ];

    ageRatingRules = [(v) => !!v || "Age rating is required"];

    get img() {
      return this.$store.state.thumbnail;
    }

    get title() {
      //return this.metadata.title;
      return this.$store.state.metadata.title;
    }

    set title(value: string) {
      //this.metadata.title = value;
      this.$store.state.metadata.title = value;
    }

    get description() {
      return this.$store.state.metadata.description;
    }

    set description(value: string) {
      this.$store.state.metadata.description = value;
    }

    get ageRating() {
      return this.$store.state.metadata.ageRating;
    }

    set ageRating(value: string) {
      this.$store.state.metadata.ageRating = value;
    }

    get selectedTags() {
      return this.$store.state.metadata.tags;
    }

    set selectedTags(value: Array<string>) {
      this.$store.state.metadata.tags = value;
    }

    get allowDerivativeWork() {
      return this.$store.state.metadata.allowDerivativeWork;
    }

    set allowDerivativeWork(value: boolean) {
      this.$store.state.metadata.allowDerivativeWork = value;
    }

    get isPublished() {
      return this.$store.state.metadata.publisherId;
    }

    get isUpdatable() {
      return (
        this.isPublished &&
        this.$store.state.metadata.publisherId ==
          WorkshopManager.getInstance().SteamId
      );
    }

    get isPublishable() {
      // unpublished work
      if (!this.isPublished) {
        return true;
      } else {
        const myWork =
          this.$store.state.metadata.publisherId ==
          WorkshopManager.getInstance().SteamId;
        // published work
        let publishable =
          myWork || (!myWork && this.$store.state.metadata.allowDerivativeWork);

        return publishable;
      }
    }

    reset() {
      if (this.$refs.form) {
        (this.$refs.form as HTMLFormElement).reset();
      }
      this.$store.dispatch("changeMetadata", Editor.getMetadata());
      this.$forceUpdate();
    }

    show() {
      this.prepareModel();
      this.dialog = true;
    }

    hide() {
      this.dialog = false;
    }

    prepareModel() {
      let outputCanvas = Editor.getScene().outputNode.imageCanvas.canvas;
      this.$store.state.thumbnail = canvasToThumbnailURL(outputCanvas);
      this.$store.dispatch("changeMetadata", Editor.getMetadata());
      this.$forceUpdate();
    }
  }
</script>
