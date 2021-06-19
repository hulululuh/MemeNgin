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
              />
              <v-textarea
                v-model="description"
                name="input-5-1"
                label="Description"
              />
              <v-list-item class="ma-0 pa-0">
                <v-select
                  v-model="ageRating"
                  label="Age rating*"
                  required
                  :items="ratings"
                  :rules="ageRatingRules"
                />

                <v-btn
                  class="mx-2"
                  fab
                  dark
                  small
                  color="primary"
                  @click="showAgeDialog"
                >
                  <v-icon dark>
                    mdi-help
                  </v-icon>
                </v-btn>
              </v-list-item>
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
              <v-list-item class="ma-0 pa-0">
                <v-checkbox
                  v-model="agreed"
                  required
                  class="ma-0 pa-0"
                  :label="`I agree terms and conditions*`"
                  :rules="agreeRules"
                />
                <v-spacer />
                <v-btn
                  class="mx-2"
                  fab
                  dark
                  small
                  color="primary"
                  @click="showLegalDialog"
                >
                  <v-icon dark>
                    mdi-help
                  </v-icon>
                </v-btn>
              </v-list-item>
            </v-form>
          </v-col>
          <v-col align="center" justify="center" cols="4">
            <v-spacer />
            Thumbnail
            <v-card width="256px" class="mx-2" fab dark small>
              <v-img
                class="align-center"
                style="text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;"
                height="256px"
                v-bind:src="img"
                lazy-src="assets/icons/image.svg"
              />
            </v-card>
            <v-btn block :disabled="isPublished" @click="openItemLink">
              Find it on steam
            </v-btn>
            <v-btn block :disabled="isPublished" @click="openAuthorLink">
              <v-icon> mdi-close </v-icon>
              {{ authorName }}
            </v-btn>
          </v-col>
        </v-row>
        <small>*indicates required field</small>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="blue darken-1" text @click="onCancel">
          Close
        </v-btn>
        <v-btn
          v-show="isUpdatable"
          color="blue darken-1"
          text
          @click="dialog = false"
          :disabled="!agreed"
        >
          Update
        </v-btn>
        <v-btn
          v-show="isPublishable"
          color="blue darken-1"
          text
          @click="onPublish"
          :disabled="!agreed"
        >
          Publish
        </v-btn>
      </v-card-actions>
    </v-card>
    <age-dialog ref="ageDialog" />
    <legal-dialog ref="legalDialog" />
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
  import AgeDialog from "@/views/AgeDialog.vue";
  import LegalDialog from "@/views/LegalDialog.vue";

  @Component({
    components: {
      legalDialog: LegalDialog,
      ageDialog: AgeDialog,
    },
  })
  export default class PublishDialog extends Vue {
    dialog: boolean = false;
    notifications: boolean = false;
    sound: boolean = true;
    widgets: boolean = false;
    tabs: number[] = null;
    ratings: string[] = AGE_RATING;
    tags: string[] = TAGS_TEST;

    key: number = 0;
    agreed: boolean = false;

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

    agreeRules = [
      (v) =>
        (!!v && v == true) ||
        "You need to agree terms and conditions to submit your work on workshop.",
    ];

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

    get authorName() {
      return "Author Name";
    }

    showAgeDialog() {
      (this.$refs.ageDialog as AgeDialog).dialog = true;
    }

    showLegalDialog() {
      (this.$refs.legalDialog as LegalDialog).dialog = true;
    }

    openItemLink() {}

    openAuthorLink() {}

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
