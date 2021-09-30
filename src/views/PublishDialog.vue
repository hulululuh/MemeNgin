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
        {{ textTitle }}
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="8">
            <v-form ref="form" lazy-validation>
              <v-text-field
                v-model="title"
                :label="textTitleItem"
                :rules="titleRules"
                required
                @change="onFormChange"
              />
              <v-textarea
                v-model="description"
                name="input-5-1"
                :label="textDescription"
                @change="onFormChange"
              />
              <v-list-item class="ma-0 pa-0">
                <v-select
                  v-model="ageRating"
                  required
                  :label="textAgeRating"
                  :items="ratings"
                  :rules="ageRatingRules"
                  @change="onFormChange"
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
                :label="textTags"
                multiple
                @change="onFormChange"
              />
              <v-list-item class="ma-0 pa-0">
                <v-checkbox
                  v-model="agreed"
                  required
                  class="ma-0 pa-0"
                  :label="textAgreeTerms"
                  :rules="agreeRules"
                  @click="onAgreeing"
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
            {{ textThumbnail }}
            <v-card width="256px" class="mx-2" fab dark small>
              <v-img
                class="align-center"
                style="text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;"
                height="256px"
                v-bind:src="img"
                lazy-src="assets/icons/image.svg"
              />
            </v-card>
            <v-btn
              block
              style="text-transform: unset !important;"
              @click="openItemLink"
            >
              {{ textFindOnSteam }}
            </v-btn>
            <v-btn
              style="text-transform: unset !important;"
              block
              @click="openAuthorLink"
            >
              <v-spacer />
              <v-card class="mr-2" elevation="0">
                <v-img :src="authorAvatar" max-height="32" max-width="32" />
              </v-card>
              {{ authorName }}
              <v-spacer />
            </v-btn>
          </v-col>
        </v-row>
        <small>{{ textRequired }}</small>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="blue darken-1" text @click="onCancel">
          {{ textClose }}
        </v-btn>
        <v-btn
          v-show="isUpdatable"
          color="blue darken-1"
          text
          @click="dialog = false"
          :disabled="!agreed"
        >
          {{ textUpdate }}
        </v-btn>
        <v-btn
          v-show="isPublishable"
          color="blue darken-1"
          text
          @click="publishClicked"
          :disabled="!agreed"
        >
          {{ textPublish }}
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
  import { getThumbnail } from "@/lib/designer";
  import { WorkshopManager } from "@/community/workshop";
  import { TextManager } from "@/assets/textmanager";
  import AgeDialog from "@/views/AgeDialog.vue";
  import LegalDialog from "@/views/LegalDialog.vue";

  const electron = require("electron");
  const shell = electron.shell;

  export const TITLE_RULES = [
    (v) => /^(\w+\.? )*\w+$/.test(v) || "project name is not valid",
    (v) => !!v || "Name is required",
    (v) => (v && v.length <= 25) || "Name must be less than 25 characters",
  ];
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

    @Emit()
    onCancel() {
      this.dialog = false;
      this.$emit("onCancel");
    }

    publishClicked() {
      // following line looks too complex, but it is a walkaround for error.
      // https://stackoverflow.com/questions/52109471/typescript-in-vue-property-validate-does-not-exist-on-type-vue-element
      if ((this.$refs.form as Vue & { validate: () => boolean }).validate()) {
        this.dialog = false;
        document.dispatchEvent(new Event("publishRequested"));
      }
    }

    tryClose() {
      if (this.dialog) this.dialog = false;
    }

    get titleRules() {
      return TITLE_RULES;
    }

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
      return this.$store.state.metadata.title;
    }

    set title(value: string) {
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

    get agreed() {
      return this.$store.state.userData.agreed;
    }

    set agreed(value: boolean) {
      this.$store.state.userData.agreed = value;
    }

    get isPublished() {
      return this.$store.state.metadata.publisherId != null;
    }

    get isUpdatable() {
      return (
        this.isPublished &&
        this.$store.state.metadata.publisherId ==
          WorkshopManager.getInstance().SteamId
      );
    }

    get isPublishable() {
      return true;
      // // unpublished work
      // if (!this.isPublished) {
      //   return true;
      // } else {
      //   const myWork =
      //     this.$store.state.metadata.publisherId ==
      //     WorkshopManager.getInstance().SteamId;

      //   return myWork;
      // }
    }

    get itemData() {
      return this.$store.state.selectedProject;
    }

    get authorAvatar() {
      const avatar = this.$store.state.currentProjectAuthorAvatar;
      if (!avatar) {
        return "mdi-account-box";
      } else {
        return avatar;
      }
    }

    get authorName() {
      const name = this.$store.state.currentProjectAuthorName;
      if (name && name.length > 0) {
        return name;
      } else {
        return "Author Name";
      }
    }

    get textTitle() {
      return TextManager.translate("${publish_dialog.title}");
    }

    get textTitleItem() {
      return TextManager.translate("${publish_dialog.title_item}") + "*";
    }

    get textDescription() {
      return TextManager.translate("${publish_dialog.description}");
    }

    get textAgeRating() {
      return TextManager.translate("${publish_dialog.age_rating}") + "*";
    }

    get textTags() {
      return TextManager.translate("${publish_dialog.tags}");
    }

    get textDerivative() {
      return TextManager.translate("${publish_dialog.derivative}");
    }

    get textAgreeTerms() {
      return TextManager.translate("${publish_dialog.agree_terms}");
    }

    get textClose() {
      return TextManager.translate("${ui_general.close}");
    }

    get textUpdate() {
      return TextManager.translate("${ui_general.update}");
    }

    get textRequired() {
      return TextManager.translate("${publish_dialog.required}");
    }

    get textThumbnail() {
      return TextManager.translate("${publish_dialog.thumbnail}");
    }

    get textFindOnSteam() {
      return TextManager.translate("${publish_dialog.find_on_steam}");
    }

    get textPublish() {
      return TextManager.translate("${ui_general.publish}");
    }

    onFormChange() {
      document.dispatchEvent(new Event("metadataChanged"));
    }

    showAgeDialog() {
      (this.$refs.ageDialog as AgeDialog).dialog = true;
    }

    showLegalDialog() {
      (this.$refs.legalDialog as LegalDialog).dialog = true;
      this.$store.state.seenLegal = true;
    }

    onAgreeing() {
      if (this.$store.state.userData.agreed && !this.$store.state.seenLegal) {
        this.showLegalDialog();
      }
    }

    openItemLink() {
      if (!this.itemData || !this.itemData.workshopItem) return;
      shell.openExternal(
        `steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/?id=${this.itemData.workshopItem.publishedFileId}`
      );
    }

    openAuthorLink() {
      if (!this.itemData || !this.itemData.workshopItem) return;
      shell.openExternal(
        `steam://openurl/https://steamcommunity.com/profiles/${this.itemData.workshopItem.publisherId}`
      );
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
      this.$store.state.thumbnail = getThumbnail();
      // copy thumbnail url
      Editor.getMetadata().thumbnail = `${this.$store.state.thumbnail}`;
      this.$store.dispatch("changeMetadata", Editor.getMetadata());
      this.$forceUpdate();
    }
  }
</script>
