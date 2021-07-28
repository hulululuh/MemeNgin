<template>
  <v-flex justify-center align-center fluid flex>
    <v-layout class="justify-center">
      <v-card width="256px" height="256px" fab small>
        <v-img
          class="mx-auto"
          style="text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;"
          lazy-src="assets/icons/image.svg"
          v-bind:src="thumbnail"
        >
          <v-spacer />
          <v-progress-linear
            v-show="isDownloading"
            color="rgba(0, 149, 255, 0.4)"
            :value="downloaded"
            height="100%"
            striped
          >
          </v-progress-linear>
        </v-img>
      </v-card>
    </v-layout>
    <v-layout class="justify-center align-center mt-1">
      <v-spacer />
      <tooltip-button
        icon="mdi-folder-open-outline"
        tooltip="Open project"
        :disabled="!isReady"
        @click="openProject"
      />
      <v-btn
        style="text-transform: unset !important;"
        width="130px"
        @click="onSubscribeButton"
        :color="colorSubscribe"
      >
        <v-icon dark>
          {{ iconSubscribe }}
        </v-icon>
        {{ textSubscribe }}
      </v-btn>
      <v-btn icon :color="colorVotedUp" @click="onVoteUp">
        <v-icon>mdi-thumb-up</v-icon>
      </v-btn>
      <v-btn icon :color="colorVotedDown" @click="onVoteDown">
        <v-icon>mdi-thumb-down</v-icon>
      </v-btn>
      <v-spacer />
    </v-layout>
    <v-divider class="mt-0 mt-2 pb-2" />
    <v-btn
      style="text-transform: unset !important;"
      block
      :disabled="!isPublished"
      @click="openItemLink"
    >
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
  import { WorkshopManager, PROGRESS_TICK } from "@/community/workshop";
  import App from "@/App.vue";
  import TooltipButton from "@/views/TooltipButton.vue";
  const greenworks = require("greenworks");
  const electron = require("electron");
  const shell = electron.shell;

  @Component({
    components: {
      tooltipButton: TooltipButton,
    },
  })
  export default class WorkshopItem extends Vue {
    progress: number = 0;
    isDownloading: boolean = false;
    isFinished: boolean = false;
    selectedItemId: string = "";

    mounted() {
      document.addEventListener("selectionChanged", this.onSelectionChanged);
      document.addEventListener("downloadStarted", this.onDownloadStarted);
      document.addEventListener("downloadEnded", this.onDownloadEnded);
    }

    destroyed() {
      document.removeEventListener("selectionChanged", this.onSelectionChanged);
      document.removeEventListener("downloadStarted", this.onDownloadStarted);
      document.removeEventListener("downloadEnded", this.onDownloadEnded);
    }

    async onSelectionChanged(evt: CustomEvent) {
      // finish current download progress
      this.isFinished = true;

      // change target
      this.selectedItemId = evt.detail.itemId;
      const state = await WorkshopManager.getInstance().getItemState(
        this.selectedItemId
      );
      const itemState = state.itemState;

      if (
        itemState & greenworks.UGCItemState.Downloading ||
        itemState & greenworks.UGCItemState.NeedsUpdate
      ) {
        if (!this.isDownloading) {
          this.isDownloading = true;
          this.onDownloading();
        }
      } else {
        this.isDownloading = false;
      }
    }

    onDownloadStarted(evt: CustomEvent) {
      this.isDownloading = true;
      this.onDownloading();
    }

    async onDownloading() {
      if (this.isDownloading) {
        this.isFinished = false;
        while (!this.isFinished) {
          // download loop
          this.isFinished = await this.refreshDownloadProgress(
            this.selectedItemId
          );
          await setTimeout(() => {}, PROGRESS_TICK);
        }
        document.dispatchEvent(
          new CustomEvent("downloadEnded", {
            detail: {
              itemId: this.selectedItemId,
            },
          })
        );
      }
    }

    async onDownloadEnded(evt: CustomEvent) {
      // set progress value to 1 for animation
      this.progress = 1;
      setTimeout(() => {
        // then clear progress states
        if (this.isDownloading) this.isDownloading = false;
        this.progress = 0;

        // update downloaded items
        WorkshopManager.getInstance().refresh();

        (this.$root.$children[0] as App).refreshSelectedItem();
      }, 300);
    }

    get downloaded() {
      return this.progress * 100;
    }

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
        return WorkshopManager.getInstance().getAuthorAvatar(
          this.itemData.workshopItem.publisherId
        );
      }
    }

    get authorName() {
      if (!this.itemData) {
        return "Author Name";
      } else {
        return WorkshopManager.getInstance().getAuthorName(
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

    get iconSubscribe() {
      return this.isSubscribed ? `mdi-minus` : `mdi-plus`;
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

    get isReady() {
      return this.$store.state.selectedProjectState
        ? this.$store.state.selectedProjectState.itemState &
            greenworks.UGCItemState.Installed
        : false;
    }

    async refreshDownloadProgress(itemId: string): Promise<boolean> {
      const state = await WorkshopManager.getInstance().getItemState(itemId);
      const itemState = state.itemState;

      let progress = 1;
      let isFinished = false;
      if (
        itemState & greenworks.UGCItemState.Downloading ||
        itemState & greenworks.UGCItemState.NeedsUpdate
      ) {
        let downloadProgress = await WorkshopManager.getInstance().getDownloadProgress(
          itemId
        );

        if (downloadProgress.expected == 0) {
          progress = Math.ceil(this.progress);
        } else {
          progress = downloadProgress.downloaded / downloadProgress.expected;
        }
      } else if (itemState & greenworks.UGCItemState.Installed) {
        progress = 1;
      } else if (itemState & greenworks.UGCItemState.DownloadPending) {
        progress = 0;
      }

      this.progress = progress;
      console.warn(this.progress);
      if (progress == 1) isFinished = true;

      return isFinished;
    }

    async openProject() {
      try {
        let item = await WorkshopManager.getInstance().synchroizeItem(
          this.$store.state.selectedProject
        );
        (this.$root.$children[0] as App).openProjectWithItem(item);
      } catch {
        console.error(`open project failed`);
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
