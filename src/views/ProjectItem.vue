<template v-on:change="onChanged">
  <v-hover v-slot="{ hover }">
    <v-card
      class="pa-0 ma-0 d-flex flex-wrap"
      min-width="192px"
      max-width="256px"
      :aspect-ratio="1"
      :elevation="hover ? 16 : 2"
      :color="active ? selectedColor : ''"
      :class="{ 'on-hover': hover }"
      @click="onClicked"
    >
      <v-img
        id="thumbnail"
        class="white--text align-center"
        style="text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
        v-bind:src="thumbnail"
        lazy-src="assets/icons/image.svg"
        :gradient="gradient"
        width="100%"
        height="100%"
      >
        <div>
          <v-scale-transition>
            <v-btn
              style="position:absolute; left: 0px; top: 0px; background-color: rgba(255, 255, 255, 0.42);"
              fab
              x-small
              v-show="hover && isReadonly"
              justify-left
              @click.stop=""
            >
              <v-icon> mdi-lock-outline </v-icon>
            </v-btn>
          </v-scale-transition>

          <v-scale-transition>
            <v-btn
              style="position:absolute; right: 0px; top: 0px; background-color: rgba(255, 255, 255, 0.42);"
              fab
              x-small
              v-show="hover && deletable"
              justify-right
              @click.stop="remove"
            >
              <v-icon> mdi-delete</v-icon>
            </v-btn>
          </v-scale-transition>
        </div>
        <v-card-title class="justify-center" fluid style="font-size:18px">
          {{ itemData.title }}
        </v-card-title>

        <v-expand-transition>
          <div
            v-if="hover"
            class="transition-fast-in-fast-out v-card--reveal"
            style="height: 35%; background-color: rgba(255, 255, 255, 0.42); font-size:13px; font-weight: bold;
              text-shadow: none; color:#000; line-height: 1.125;"
          >
            {{ description }}
          </div>
        </v-expand-transition>
      </v-img>
      <v-spacer />
      <v-progress-linear
        v-show="isDownloading"
        color="rgba(0, 149, 255, 0.4)"
        :value="downloaded"
        striped
        bottom
      >
      </v-progress-linear>
    </v-card>
  </v-hover>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Prop, Component } from "vue-property-decorator";
  import { ProjectItemData } from "@/community/ProjectItemData";
  import App from "@/App.vue";
  import { WorkshopManager, PROGRESS_TICK } from "@/community/workshop";
  import { isInsideReservedPath } from "@/lib/utils";
  const greenworks = require("greenworks");

  export class ProjectItemDeleteEvent extends CustomEvent<any> {
    item: ProjectItemData;
    action: DeleteAction;
  }

  export enum ClickAction {
    Open,
    Select,
  }

  export enum DeleteAction {
    None, // no button
    Unlist, // recent
    Cloud, // my work
    Unsubscribe, // usbscribed
    Unfavorable, // search result
  }

  @Component
  export default class ProjectItem extends Vue {
    @Prop() itemData: ProjectItemData;
    @Prop() clickAction: ClickAction;
    @Prop() deleteAction: DeleteAction;
    @Prop() readonly: boolean;
    @Prop() active: boolean;
    progress: number = 0;
    isDownloading: boolean = false;
    isFinished: boolean = false;

    mounted() {
      document.addEventListener("downloadStarted", this.onDownloadStarted);
      document.addEventListener("downloadEnded", this.onDownloadEnded);

      // update download status on creation
      if (this.itemData.workshopItem) {
        this.onDownloadStarted(
          new CustomEvent("downloadStarted", {
            detail: { itemId: this.itemData.workshopItem.publishedFileId },
          })
        );
      }
    }

    destroyed() {
      document.removeEventListener("downloadStarted", this.onDownloadStarted);
      document.removeEventListener("downloadEnded", this.onDownloadEnded);
    }

    async onDownloadStarted(evt: CustomEvent) {
      if (
        evt.detail.itemId &&
        evt.detail.itemId == this.itemData.workshopItem.publishedFileId
      ) {
        // change target
        const state = await WorkshopManager.getInstance().getItemState(
          evt.detail.itemId
        );
        const itemState = state.itemState;

        if (
          itemState & greenworks.UGCItemState.Downloading ||
          itemState & greenworks.UGCItemState.NeedsUpdate
        ) {
          this.isDownloading = true;
          this.onDownloading();
        }
      }
    }

    async onDownloading() {
      const itemId = this.itemData.workshopItem.publishedFileId;
      if (this.isDownloading) {
        this.isFinished = false;
        while (!this.isFinished) {
          // download loop
          this.isFinished = await this.refreshDownloadProgress(itemId);
          await setTimeout(() => {}, PROGRESS_TICK);
        }
        document.dispatchEvent(
          new CustomEvent("downloadEnded", {
            detail: {
              itemId: itemId,
            },
          })
        );
      }
    }

    async onDownloadEnded(evt: CustomEvent) {
      if (
        evt.detail.itemId &&
        evt.detail.itemId == this.itemData.workshopItem.publishedFileId
      ) {
        // set progress value to 1 for animation
        this.progress = 1;
        await setTimeout(() => {
          // then clear progress states
          if (this.isDownloading) this.isDownloading = false;
          this.progress = 0;

          // update downloaded items
          WorkshopManager.getInstance().refresh();

          (this.$root.$children[0] as App).refreshSelectedItem();
        }, 300);
      }
    }

    get downloaded() {
      return this.progress * 100;
    }

    get selectedColor() {
      return "#bbe1faff";
    }

    get gradient() {
      return this.active ? "to top right, #bbe1fa11, #bbe1fa22" : "";
    }

    async onClicked() {
      if (this.clickAction == ClickAction.Open) {
        console.log("tried to open");
        this.open();
      } else {
        const selectedItemId = this.itemData.workshopItem.publishedFileId;
        if (this.$store.state.selectedItemId != selectedItemId) {
          this.$store.state.selectedProject = this.itemData;
          this.$store.state.selectedProjectState = await WorkshopManager.getInstance().getItemState(
            selectedItemId
          );

          const publisherId = this.itemData.workshopItem.publisherId;
          WorkshopManager.getInstance().requestUserInfo(publisherId);
          await new Promise((resolve) => setTimeout(resolve, 200));
          this.$store.state.selectedAuthorName = WorkshopManager.getInstance().getAuthorName(
            publisherId
          );
          this.$store.state.selectedAuthorAvatar = WorkshopManager.getInstance().getAuthorAvatar(
            publisherId
          );

          // send selection event to workshopItem.vue
          document.dispatchEvent(
            new CustomEvent("selectionChanged", {
              detail: {
                itemId: selectedItemId,
              },
            })
          );
        }
      }
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

    get deletable() {
      return (
        this.deleteAction != DeleteAction.None &&
        this.deleteAction != DeleteAction.Unfavorable
      );
    }

    get isReadonly() {
      if (isInsideReservedPath(this.itemData.path)) return true;
      return this.readonly;
    }

    open() {
      (this.$root.$children[0] as App).openProjectWithItem(this.itemData);
    }

    remove() {
      let event = new ProjectItemDeleteEvent("projectItemDelete", {
        detail: {
          item: this.itemData,
          action: this.deleteAction,
        },
      });
      document.dispatchEvent(event);
    }

    get thumbnail() {
      return this.itemData.thumbnail;
    }

    get description() {
      return this.itemData.description
        ? this.itemData.description.substring(0, 200)
        : "";
    }
  }
</script>
