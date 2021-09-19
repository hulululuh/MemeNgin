<template>
  <v-dialog
    v-model="dialog"
    persistent
    max-width="960px"
    max-height="800px"
    @keydown.esc="dialog = false"
  >
    <v-card style="overflow-y: hidden !important;">
      <v-card-title class="headline grey">
        {{ textTitle }}
      </v-card-title>
      <v-card-text block class="pa-0 ma-0">
        <v-col cols="12" justify-center class="grey lighten-2 pa-1">
          <tooltip-button
            icon="mdi-content-save-outline"
            tooltip="Render animation"
            :disabled="working"
            @click="renderToGif"
          />
          <tooltip-button
            icon="mdi-cancel"
            tooltip="Abort"
            :disabled="aborted"
            @click="abortRender"
          />
        </v-col>
        <v-row justify="center">
          <v-img
            block
            max-width="512px"
            max-height="512px"
            lazy-src="assets/icons/image.svg"
          />
        </v-row>
      </v-card-text>
      <v-card-actions justify-center>
        <v-row>
          <v-col cols="12" justify-center>
            <v-btn class="ma-1" color="grey" width="100%" @click="hide">
              {{ textDone }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Component } from "vue-property-decorator";
  import { TextManager } from "@/assets/textmanager";
  import Preview2D from "@/views/Preview2D.vue";
  import TooltipButton from "@/views/TooltipButton.vue";
  import { Editor } from "@/lib/editor";
  import { GifCodec } from "gifwrap";
  import { TimeNode } from "@/lib/library/nodes/timenode";
  const codec = new GifCodec();

  @Component({
    components: {
      preview2d: Preview2D,
      tooltipButton: TooltipButton,
    },
  })
  export default class RenderDialog extends Vue {
    dialog: boolean = false;
    aborted: boolean = true;
    frameRendering: boolean = false;
    working: boolean = false;

    show() {
      this.dialog = true;
    }

    hide() {
      this.dialog = false;
    }

    mounted() {
      document.addEventListener("frameRendered", this.onFrameRendered);

      const preview = this.$refs.preview2d as Preview2D;
      if (preview) {
        preview.reset();
        preview.setEditor(Editor.getInstance());
      }
    }

    destroyed() {
      document.removeEventListener("frameRendered", this.onFrameRendered);
    }

    get textTitle() {
      return TextManager.translate("${render_dialog.title}");
    }

    get textDone() {
      return TextManager.translate("${ui_general.done}");
    }

    saveResult() {}

    abortRender() {
      this.aborted = true;
    }

    onFrameRendered() {
      this.frameRendering = false;
    }

    async renderToGif() {
      if (this.working) return;
      const scene = Editor.getInstance().nodeScene;
      const outputNode = scene.outputNode;
      const timeNode = scene.timeNode;

      if (timeNode == null) {
        this.aborted = true;
        return;
      } else {
        this.working = true;
        this.aborted = false;
        let tNode = timeNode.dNode as TimeNode;
        // goto first frame
        tNode.setProgress(0);

        const numFrames = tNode.getPropertyValueByName("numFrames");
        const valFrame = 1 / numFrames;
        let frames;

        // sample frame by frame
        for (let i = 0; i < numFrames; i++) {
          if (this.aborted) break;
          let value = i * valFrame;

          this.frameRendering = true;
          tNode.setProgress(value);

          // wait until frame is rendered
          while (this.frameRendering) {
            await this.delay(1);
          }
        }
        // save to Image/Gif Url
        // codec.encodeGif(frames, spec);

        tNode.setProgress(0);
        this.working = false;
      }
      this.aborted = true;
    }

    delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }
</script>
