<template>
  <v-dialog
    v-model="dialog"
    persistent
    max-width="960px"
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
        <v-row class="ma-0 pa-0">
          <v-col cols="12" justify-center class="grey lighten-2 pa-1">
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
              :disabled="!gif"
              @click="saveGif"
            />
          </v-col>
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
  import Preview2D from "@/views/Preview2D.vue";
  import TooltipButton from "@/views/TooltipButton.vue";
  import { Editor } from "@/lib/editor";
  import { GifCodec, GifUtil, Gif } from "gifwrap";
  import { TimeNode } from "@/lib/library/nodes/timenode";
  import { NodeGraphicsItem } from "@/lib/scene/nodegraphicsitem";
  import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
  const { dialog } = require("electron").remote;
  const { GifFrame } = require("gifwrap");
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
    initialized: boolean = false;
    frames: any[] = null;
    gif: Gif = null;

    onPreviewNode(item: NodeGraphicsItem): void {
      (this.$refs.preview2d as Preview2D).onFrameRendered(item);
    }

    show() {
      this.dialog = true;
    }

    hide() {
      this.dialog = false;
    }

    updated() {
      this.initPreview();
    }

    async initPreview() {
      const preview = this.$refs.preview2d as Preview2D;
      const frame = this.$refs.frame as HTMLElement;
      if (preview && !this.initialized) {
        await this.delay(1);
        preview.reset();
        preview.resize(frame.clientWidth, frame.clientHeight);
        this.onPreviewNode(Editor.getInstance().nodeScene.outputNode);
        this.initialized = true;
      }
    }

    mounted() {
      document.addEventListener("frameRendered", this.onFrameRendered);
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

    get frameIndex() {
      this.$store.state.progress;
      this.$store.state.currentFrame;
      if (!Editor.getInstance().nodeScene) return 0;
      const timeNode = Editor.getInstance().nodeScene.timeNode
        .dNode as TimeNode;
      if (timeNode) {
        return `${this.$store.state.currentFrame}/${timeNode.numFrames - 1}`;
      }
    }

    set frameIndex(value) {
      // it's a read only property
      //this.$store.state.progress = value;
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
        const tNode = timeNode.dNode as TimeNode;
        let prop = tNode.properties.find((x) => {
          return x.name == "progress";
        });

        const v = val / 100;
        tNode.setProperty("progress", { value: v, exposed: prop.exposed });
        this.$store.state.progress = val;
        this.$store.state.currentFrame = Math.floor(
          (v + Number.EPSILON) * tNode.numFrames
        );
      }
    }

    saveResult() {}

    abortRender() {
      this.aborted = true;
    }

    onFrameRendered() {
      this.frameRendering = false;
    }

    async playAnimation() {
      if (this.working) return;
      const scene = Editor.getInstance().nodeScene;
      const timeNode = scene.timeNode;

      if (timeNode == null) {
        this.aborted = true;
        return;
      } else {
        //const frames = [];
        this.frames = [];
        this.working = true;
        this.aborted = false;
        let tNode = timeNode.dNode as TimeNode;
        // goto first frame
        tNode.setProgress(0);
        this.$store.state.progress = 0;
        this.$store.state.currentFrame = 0;

        const numFrames = tNode.getPropertyValueByName("numFrames");
        const valFrame = 1 / numFrames;

        // sample frame by frame
        for (let i = 0; i < numFrames; i++) {
          if (this.aborted) break;
          let value = i * valFrame;

          this.frameRendering = true;
          tNode.setProgress(value);
          this.$store.state.progress = value * 100;
          this.$store.state.currentFrame = i;

          // wait until frame is rendered
          while (this.frameRendering) {
            await this.delay(1);
          }
        }
        tNode.setProgress(0);
        this.$store.state.progress = 0;
        this.$store.state.currentFrame = 0;
        this.working = false;
      }
      this.aborted = true;
    }

    async renderToGif() {
      if (this.working) return;
      this.gif = null;
      const scene = Editor.getInstance().nodeScene;
      const outputNode = scene.outputNode;
      const timeNode = scene.timeNode;

      if (timeNode == null) {
        this.aborted = true;
        return;
      } else {
        //const frames = [];
        this.frames = [];
        this.working = true;
        this.aborted = false;
        let tNode = timeNode.dNode as TimeNode;
        // goto first frame
        tNode.setProgress(0);
        this.$store.state.progress = 0;
        this.$store.state.currentFrame = 0;

        const numFrames = tNode.getPropertyValueByName("numFrames");
        const valFrame = 1 / numFrames;

        // sample frame by frame
        for (let i = 0; i < numFrames; i++) {
          if (this.aborted) break;
          let value = i * valFrame;

          this.frameRendering = true;
          tNode.setProgress(value);
          this.$store.state.progress = value * 100;
          this.$store.state.currentFrame = i;

          // wait until frame is rendered
          while (this.frameRendering) {
            await this.delay(1);
          }

          // timePerFrame
          const tpf = (Editor.getInstance().nodeScene.timeNode
            .dNode as TimeNode).timePerFrame;
          const canvas = Editor.getInstance().nodeScene.outputNode.imageCanvas
            .canvas;
          const w = canvas.width;
          const h = canvas.height;
          let frame = new GifFrame(w, h, { delayCentisecs: tpf * 100.0 });
          const ctx = canvas.getContext("2d");
          frame.bitmap.data = Buffer.from(ctx.getImageData(0, 0, w, h).data);
          const indexCount = frame.getPalette().indexCount;

          if (indexCount > 256) {
            GifUtil.quantizeDekker(frame, 256);
          }
          this.frames.push(frame);
        }

        // encode gif
        this.gif = await new Promise((resolve) => {
          codec.encodeGif(this.frames, { loops: 0 }).then((gif) => {
            // byte encoding is now in gif.buffer
            resolve(gif);
          });
        });

        // swap canvas to encoded gif
        const gifAsString = `data:image/gif;base64,${this.gif.buffer.toString()}`;

        tNode.setProgress(0);
        this.$store.state.progress = 0;
        this.$store.state.currentFrame = 0;
        this.working = false;
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

      // save to Image/Gif Url
      if (this.gif) {
        GifUtil.write(result.filePath, this.frames);
      }
    }
  }
</script>
