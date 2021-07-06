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
    <v-layout class="justify-center align-center mt-1">
      <v-spacer />
      <v-btn width="150px" @click="onSubscribeButton" :color="colorSubscribe">
        <v-icon dark>
          mdi-plus
        </v-icon>
        {{ textSubscribe }}
      </v-btn>
      <v-spacer />
      <v-btn icon :color="colorVotedUp" @click="onVoteUp">
        <v-icon>mdi-thumb-up</v-icon>
      </v-btn>
      <v-btn icon :color="colorVotedDown" @click="onVoteDown">
        <v-icon>mdi-thumb-down</v-icon>
      </v-btn>
      <v-spacer />
    </v-layout>
    <v-divider class="mt-0 mt-2 pb-2" />
    <v-btn block :disabled="!isPublished" @click="openItemLink">
      {{ textFindOnSteam }}
    </v-btn>
    <v-btn
      style="text-transform: unset !important;"
      block
      :disabled="!isPublished"
      @click="openAuthorLink"
    >
      <v-spacer />
      <v-card class="mr-2" elevation="0">
        <v-img :src="authorAvatar" max-height="32" max-width="32" />
      </v-card>
      {{ authorName }}
      <v-spacer />
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
  import { toDataURL } from "@/lib/utils";
  const greenworks = require("greenworks");
  const electron = require("electron");
  const shell = electron.shell;

  @Component
  export default class WorkshopItem extends Vue {
    get itemData() {
      return this.$store.state.selectedProject;
    }

    get thumbnail() {
      return this.itemData ? this.itemData.thumbnail : null;
    }

    get isPublished() {
      return this.itemData ? this.itemData.workshopItem.itemId : false;
    }

    get authorAvatar() {
      if (!this.itemData) {
        return "mdi-account-box";
      } else {
        const imgHandle = greenworks.getMediumFriendAvatar(
          this.itemData.workshopItem.publisherId
        );
        let rgba = greenworks.getImageRGBA(imgHandle);
        return toDataURL(64, 64, rgba);
      }
    }

    get authorName() {
      if (!this.itemData) {
        return "Author Name";
      } else {
        return greenworks.getFriendPersonaName(
          this.itemData.workshopItem.publisherId
        );
      }
    }

    get textFindOnSteam() {
      return TextManager.translate("${publish_dialog.find_on_steam}");
    }

    get textSubscribe() {
      if (!this.isSubscribed)
        return TextManager.translate("${ui_general.subscribe}");
      else return TextManager.translate("${ui_general.unsubscribe}");
    }

    get colorSubscribe() {
      if (!this.isSubscribed) return "";
      else return "primary";
    }

    get colorVotedUp() {
      return this.isVotedUp ? "primary" : "";
    }

    get colorVotedDown() {
      return this.isVotedDown ? "primary" : "";
    }

    get textUnSubscribe() {
      return TextManager.translate("${ui_general.unsubscribe}");
    }

    get isSubscribed() {
      if (!this.$store.state.selectedProjectState) return false;
      else {
        return (
          (this.$store.state.selectedProjectState.itemState &
            greenworks.UGCItemState.Subscribed) >
          0
        );
      }
    }

    get isVotedUp() {
      return this.$store.state.selectedProjectState
        ? this.$store.state.selectedProjectState.votedUp
        : false;
    }

    get isVotedDown() {
      return this.$store.state.selectedProjectState
        ? this.$store.state.selectedProjectState.votedDown
        : false;
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

    onSubscribeButton() {
      if (!this.itemData || !this.itemData.workshopItem) return;

      if (!this.isSubscribed) {
        WorkshopManager.getInstance().subscribe(
          this.itemData.workshopItem.publishedFileId
        );
        this.$store.state.selectedProjectState.itemState =
          greenworks.UGCItemState.Subscribed;
      } else {
        WorkshopManager.getInstance().unsubscribe(
          this.itemData.workshopItem.publishedFileId
        );
        this.$store.state.selectedProjectState.itemState =
          greenworks.UGCItemState.None;
      }
    }

    onVoteUp() {
      if (!this.itemData || !this.itemData.workshopItem) return;
      WorkshopManager.getInstance().voteup(
        this.itemData.workshopItem.publishedFileId
      );

      this.$store.state.selectedProjectState.votedUp = true;
      this.$store.state.selectedProjectState.votedDown = false;
    }

    onVoteDown() {
      if (!this.itemData || !this.itemData.workshopItem) return;
      WorkshopManager.getInstance().votedown(
        this.itemData.workshopItem.publishedFileId
      );

      this.$store.state.selectedProjectState.votedUp = false;
      this.$store.state.selectedProjectState.votedDown = true;
    }
  }
</script>
