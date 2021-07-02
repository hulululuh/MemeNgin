<template>
  <v-flex justify-center align-center fluid flex>
    <v-layout class="justify-center">
      <v-card width="256px" height="256px" fab small>
        <v-img
          class="mx-auto"
          style="text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;"
          lazy-src="assets/icons/image.svg"
          v-bind:src="thumbnail"
        />
      </v-card>
    </v-layout>
    <v-layout class="justify-center align-center">
      <v-spacer />
      <v-btn width="150px" @click="onSubscribeButton">
        {{ textSubscribe }}
      </v-btn>
      <v-spacer />
      <v-checkbox
        :on-icon="'mdi-thumb-up'"
        :off-icon="'mdi-thumb-up-outline'"
        @click="onVoteUp"
      />
      <v-checkbox
        :on-icon="'mdi-thumb-down'"
        :off-icon="'mdi-thumb-down-outline'"
        @click="onVoteDown"
      />
      <v-spacer />
    </v-layout>
    <v-divider class="mt-0 mt-2 pb-2" />
    <v-btn block :disabled="isPublished" @click="openItemLink">
      {{ textFindOnSteam }}
    </v-btn>
    <v-btn block :disabled="isPublished" @click="openAuthorLink">
      <v-icon> mdi-close </v-icon>
      {{ authorName }}
    </v-btn>
  </v-flex>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Component } from "vue-property-decorator";
  import { TextManager } from "@/assets/textmanager";
  import { WorkshopManager } from "@/community/workshop";

  @Component
  export default class WorkshopItem extends Vue {
    get itemData() {
      return this.$store.state.selectedProject;
    }

    get thumbnail() {
      return this.itemData ? this.itemData.thumbnail : null;
    }

    get isPublished() {
      return this.$store.state.metadata.publisherId;
    }

    get authorName() {
      return "Author Name";
    }

    get textFindOnSteam() {
      return TextManager.translate("${publish_dialog.find_on_steam}");
    }

    get textSubscribe() {
      return TextManager.translate("${ui_general.subscribe}");
    }

    get textUnSubscribe() {
      return TextManager.translate("${ui_general.unsubscribe}");
    }

    openItemLink() {
      this.itemData.workshopitem.itemId;
    }

    openAuthorLink() {
      this.itemData.workshopitem.publisherId;
    }

    onSubscribeButton() {
      WorkshopManager.getInstance().subscribe(
        this.itemData.workshopItem.itemId
      );
    }

    onVoteUp() {
      WorkshopManager.getInstance().voteup(this.itemData.workshopItem.itemId);
    }

    onVoteDown() {
      WorkshopManager.getInstance().votedown(this.itemData.workshopItem.itemId);
    }
  }
</script>
