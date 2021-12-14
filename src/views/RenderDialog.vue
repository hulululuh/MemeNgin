<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="960px"
    max-height="800px"
    @keydown.esc="dialog = false"
  >
    <v-card
      style="overflow-x: hidden !important; overflow-y: hidden !important;"
    >
      <v-card-title class="headline grey">
        {{ textTitle }}
      </v-card-title>
      <v-card-text block class="pa-0 ma-0">
        <v-row class="ma-0 grey lighten-2 pa-1">
          <tooltip-button
            icon="mdi-play"
            tooltip="Play animation"
            :disabled="working"
            @click="playAnimation"
          />
          <tooltip-button
            v-if="!working"
            icon="mdi-vhs"
            tooltip="Render animation"
            :disabled="working"
            @click="renderToGif"
          />
          <tooltip-button
            v-if="!aborted"
            icon="mdi-cancel"
            tooltip="Abort"
            :disabled="aborted"
            @click="abortRender"
          />
          <tooltip-button
            icon="mdi-content-save-outline"
            tooltip="Save as gif"
            :disabled="!encoded"
            @click="saveGif"
          />
          <v-spacer />
          <tooltip-button
            icon="mdi-fit-to-page-outline"
            tooltip="Zoom to fit"
            @click="zoomToFit"
          />
        </v-row>
        <v-row class="ma-0 pa-0" justify="center" ref="frame">
          <preview2d
            class="ma-0 pa-0"
            align="center"
            justify="center"
            ref="preview2d"
            style="height:512px !important;"
          />
        </v-row>
        <v-row class="ma-1">
          <v-col cols="11">
            <v-slider v-model="progress" block :step="step" ticks></v-slider>
          </v-col>
          <v-col>
            <v-text-field v-model="frameIndex" :width="10" readonly />
          </v-col>
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
  import { Editor } from "@/lib/editor";
  import { NodeGraphicsItem } from "@/lib/scene/nodegraphicsitem";
  import { AnimationEncoder } from "@/utils/animationencoder";
  import fs from "fs";
  import Preview2D from "@/views/Preview2D.vue";
  import TooltipButton from "@/views/TooltipButton.vue";
  const { dialog } = require("electron").remote;
  const THUMBNAIL_MAX_FRAMES = 16;

  export function cmdLine(str) {
    process.stdout.write(`${str}\n`);
  }

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
    initialized: boolean = false;
    frames: any[] = null;
    encoded: boolean = false;

    thumbnailCanvas: HTMLCanvasElement = null;

    onPreviewNode(item: NodeGraphicsItem): void {
      (this.$refs.preview2d as Preview2D)?.onFrameRendered(item);
    }

    async show() {
      this.dialog = true;
      await this.delay(5);
      this.initPreview();
    }

    hide() {
      this.aborted = true;
      this.dialog = false;
    }

    async initPreview() {
      const preview = this.$refs.preview2d as Preview2D;
      const frame = this.$refs.frame as HTMLElement;
      if (preview) {
        await this.delay(1);
        preview.resize(frame.clientWidth, frame.clientHeight);
        this.onPreviewNode(Editor.getInstance().nodeScene.outputNode);
      }
    }

    mounted() {
      document.addEventListener("frameRendered", () => {
        this.frameRendering = false;
      });
      document.addEventListener("requestThumbnail", this.renderThumbnail);
      this.thumbnailCanvas = document.createElement("canvas");
    }

    renderThumbnail() {
      this.renderToGif(true);
    }

    destroyed() {
      document.removeEventListener("requestThumbnail", this.renderThumbnail);
    }

    get textTitle() {
      return TextManager.translate("${render_dialog.title}");
    }

    get textDone() {
      return TextManager.translate("${ui_general.done}");
    }

    get frameIndex() {
      this.$store.state.progress;
      this.$store.state.currentFrame;
      if (!Editor.getInstance().nodeScene) return 0;
      const timeNode = Editor.getInstance().nodeScene.timeNode;
      if (timeNode) {
        return `${this.$store.state.currentFrame}/${timeNode.numFrames - 1}`;
      }
    }

    get step() {
      return this.$store.state.stepSize;
    }

    get progress() {
      return this.$store.state.progress;
    }

    set progress(val) {
      if (!Editor.getInstance().nodeScene) return;
      const timeNode = Editor.getInstance().nodeScene.timeNode;
      if (timeNode) {
        let prop = timeNode.properties.find((x) => {
          return x.name == "progress";
        });

        const v = val / 100;
        timeNode.setProperty("progress", { value: v, exposed: prop.exposed });
        this.$store.state.progress = val;
        this.$store.state.currentFrame = Math.floor(
          (v + Number.EPSILON) * timeNode.numFrames
        );
      }
    }

    saveResult() {}

    zoomToFit() {
      (this.$refs.preview2d as Preview2D).zoomToFit();
    }

    abortRender() {
      this.aborted = true;
    }

    onFrameRendered() {
      this.frameRendering = false;
    }

    async playAnimation() {
      if (this.working) return;
      const timeNode = Editor.getInstance().nodeScene.timeNode;
      if (timeNode == null) {
        this.aborted = true;
        return;
      } else {
        this.frames = [];
        this.working = true;
        this.aborted = false;

        const tpf = timeNode.timePerFrame;

        // goto first frame
        timeNode.setProgress(0);
        this.$store.state.progress = 0;
        this.$store.state.currentFrame = 0;

        const numFrames = timeNode.getPropertyValueByName("numFrames");
        const valFrame = 1 / numFrames;

        // sample frame by frame
        for (let i = 0; i < numFrames; i++) {
          if (this.aborted) break;
          let value = i * valFrame;

          this.frameRendering = true;
          timeNode.setProgress(value);
          this.$store.state.progress = value * 100;
          this.$store.state.currentFrame = i;

          // wait until frame is rendered
          let delayRemained = tpf * 1000;
          while (this.frameRendering) {
            await this.delay(1);
            delayRemained--;
          }

          if (delayRemained > 0) await this.delay(delayRemained);
        }
        timeNode.setProgress(0);
        this.$store.state.progress = 0;
        this.$store.state.currentFrame = 0;
        this.working = false;
      }
      this.aborted = true;
    }

    async renderToGif(isDrawingThumbnail: boolean = false) {
      if (this.working) return;
      //this.gif = null;
      const scene = Editor.getInstance().nodeScene;
      const outputNode = scene.outputNode;
      const timeNode = scene.timeNode;
      const canvas = outputNode.imageCanvas.canvas;
      const w = isDrawingThumbnail ? 256 : canvas.width;
      const h = isDrawingThumbnail ? 256 : canvas.height;

      if (isDrawingThumbnail) {
        this.thumbnailCanvas.width = w;
        this.thumbnailCanvas.height = h;
      }

      if (timeNode == null) {
        this.aborted = true;
        console.warn("rendering aborted");
        return;
      } else {
        const frames = timeNode.getPropertyValueByName("numFrames");
        const numFrames =
          isDrawingThumbnail && frames > THUMBNAIL_MAX_FRAMES
            ? THUMBNAIL_MAX_FRAMES
            : frames;
        const fps = timeNode.getPropertyValueByName("fps");
        const valFrame = 1 / numFrames;

        const encoder = AnimationEncoder.getInstance();
        encoder.init(w, h, "neuquant", false, numFrames);
        encoder.start();

        this.frames = [];
        this.working = true;
        this.aborted = false;

        // goto first frame
        timeNode.setProgress(0);
        this.$store.state.progress = 0;
        this.$store.state.currentFrame = 0;
        this.encoded = encoder.encoded;

        // sample frame by frame
        for (let i = 0; i < numFrames; i++) {
          if (this.aborted) break;

          let value = i * valFrame;
          this.frameRendering = true;
          timeNode.setProgress(value);
          this.$store.state.progress = value * 100;
          this.$store.state.currentFrame = i;

          // wait until frame is rendered
          while (this.frameRendering) {
            await this.delay(1);
          }

          // timePerFrame
          const tpf = timeNode.timePerFrame;
          let ctx: CanvasRenderingContext2D = null;

          let targetCanvas = null;

          if (isDrawingThumbnail) {
            ctx = this.thumbnailCanvas.getContext("2d");
            const sw = w / canvas.width;
            const sh = h / canvas.height;
            //let zoomFactor = sw > sh ? sh : sw;
            let zoomFactor = sh;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, 256, 256);
            ctx.setTransform(
              zoomFactor,
              0,
              0,
              zoomFactor,
              (256 - canvas.width * zoomFactor) / 2,
              0
            );

            ctx.drawImage(canvas, 0, 0);
            targetCanvas = this.thumbnailCanvas;
          } else {
            ctx = canvas.getContext("2d");
            targetCanvas = canvas;
          }
          encoder.setDelay(tpf * 1000.0);

          const imgData = ctx.getImageData(
            0,
            0,
            targetCanvas.width,
            targetCanvas.height
          );
          const pixelCount = targetCanvas.width * targetCanvas.height;

          // detect transparent pixel for encoder settings
          let isTransparent = false;
          for (let idx = 0; idx < pixelCount; idx++) {
            if (imgData.data[idx * 4 + 3] == 0) {
              isTransparent = true;
              break;
            }
          }
          if (isTransparent) {
            encoder.encoder.setTransparent("#00000000");
          }
          encoder.encoder.addFrame(ctx);
        }

        timeNode.setProgress(0);
        this.$store.state.progress = 0;
        this.$store.state.currentFrame = 0;
        this.working = false;
        encoder.finish();
        this.encoded = encoder.encoded;
      }
      this.aborted = true;
    }

    delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async saveGif() {
      const result = await dialog.showSaveDialog({
        filters: [
          {
            name: "GIF",
            extensions: ["gif"],
          },
        ],
        defaultPath: "image",
      });

      if (result.canceled) return;

      const encoder = AnimationEncoder.getInstance();
      if (encoder.encoded) {
        const buffer = encoder.getData();
        fs.writeFile(result.filePath, buffer, (error) => {
          // gif drawn or error
          if (error) console.error(error);
        });
      }
    }
  }
</script>
