<template>
  <v-flex
    class="ma-0 pa-0"
    id="container"
    v-resize="resize"
    fill-width
    fill-height
    ref="flex"
  >
    <canvas
      class="ma-0 pa-0"
      id="_2dpreview"
      ref="canvas"
      style="left: 0; top: 0; z-index: 1; background-color: transparent;"
    >
    </canvas>
    <v-flex class="ma-0 pa-0" id="overlay" fill-width fill-height ref="overlay">
      <canvas
        id="_background"
        ref="backgroundLayer"
        style="left: 0; top: 0; z-index: 0; background-color: transparent;"
      >
      </canvas>
    </v-flex>
  </v-flex>
</template>

<style scoped>
  .btn {
    text-align: center;
    height: 1.6em;
    /* width: 1.6em; */
    border-radius: 2px;
    line-height: 1.6em;
    display: block;
    float: left;
    padding: 0.4em 0.4em 0.3em 0.4em;
    margin: 0.1em;
    text-decoration: none;
    background: #666;
    color: rgba(255, 255, 255, 0.7);
  }

  .btn:hover {
    background: #999;
  }

  .toggled {
    background: #444;
  }

  #container {
    position: relative;
  }
  #container canvas,
  #overlay {
    position: absolute;
    top: 0px;
    left: 0px;
    height: 100%;
    width: 100%;
  }
</style>

<script lang="ts">
  import { Component, Vue } from "vue-property-decorator";
  import { DragZoom } from "./preview2d/previewcanvas2d";
  const electron = require("electron");
  const remote = electron.remote;
  const { dialog } = remote;
  import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";
  import { DesignerNode } from "@/lib/designer/designernode";
  import { Editor } from "@/lib/editor";
  import { NodeGraphicsItem } from "@/lib/scene/nodegraphicsitem";

  @Component
  export default class Preview2D extends Vue {
    node: DesignerNode = null;
    // HtmlCanvasElement...it will auto update when the node's image changes
    image: HTMLCanvasElement = null;
    dragZoom: DragZoom = null;
    flex: any = null;

    get canvas() {
      return this.$refs.canvas as HTMLCanvasElement;
    }

    get background() {
      return this.$refs.backgroundLayer as HTMLCanvasElement;
    }

    mounted() {
      let dragZoom = new DragZoom([this.canvas, this.background]);
      const draw = () => {
        dragZoom.draw();
        requestAnimationFrame(draw);
      };

      requestAnimationFrame(draw);
      this.dragZoom = dragZoom;

      document.addEventListener("resizeImage", (event: CustomEvent) => {
        this.resizeImage(event.detail.width, event.detail.height);
        this.zoomToFit();
      });

      document.addEventListener("frameRendered", () =>
        this.onFrameRendered(Editor.getInstance().nodeScene.outputNode)
      );
    }

    onFrameRendered(item: NodeGraphicsItem) {
      const node = item.dNode;
      const image = item.imageCanvas.canvas;
      this.node = node;
      this.image = image;
      this.dragZoom.setImage(image);
      const canvas = this.$refs.canvas as HTMLCanvasElement;

      if (node instanceof ImageDesignerNode && canvas) {
        const margin = 0.0;
        const ratioW = ((1.0 - margin) * canvas.width) / node.getWidth();
        const ratioH = ((1.0 - margin) * canvas.height) / node.getHeight();

        const zoomFactor = Math.min(1.0, Math.min(ratioW, ratioH));
        this.dragZoom.centerImage(zoomFactor);
      }
    }

    resize(width: number, height: number) {
      fitCanvasToContainer(this.canvas);
      fitCanvasToContainer(this.background);
      if (!this.dragZoom) {
        this.dragZoom = new DragZoom([this.canvas, this.background]);
      }

      // TODO: I don't think its best
      setTimeout(() => {
        this.zoomToFit();
      }, 1);
    }

    resizeImage(width, height) {
      fitCanvasToContainer(this.canvas);
      fitCanvasToContainer(this.background);

      const margin = 0.1;
      const ratioW = ((1.0 - margin) * this.canvas.width) / width;
      const ratioH = ((1.0 - margin) * this.canvas.height) / height;

      const zoomFactor = Math.min(1.0, Math.min(ratioW, ratioH));
      this.dragZoom.centerImage(zoomFactor);
    }

    saveTexture() {
      // todo: save image as png
      if (!this.hasImage) return;

      dialog
        .showSaveDialog({
          filters: [
            {
              name: "PNG",
              extensions: ["png"],
            },
          ],
          defaultPath: "image",
        })
        .then((result) => {
          let path = result.filePath;
          if (!path) return;

          let img = this.dragZoom.image;
          let canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          let ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          // Get the DataUrl from the Canvas
          // https://github.com/mattdesl/electron-canvas-to-buffer/blob/master/index.js
          const url = canvas.toDataURL("image/png", 1);
          const nativeImage = electron.nativeImage.createFromDataURL(url);
          const buffer = nativeImage.toPNG();
          const fs = require("fs");
          fs.writeFile(path, buffer, function(err) {
            //console.log(err);
            if (err) alert("Error saving image: " + err);
          });
        });
    }

    zoomToFit() {
      const imageNode = this.node as ImageDesignerNode;
      let canvas = this.$refs.canvas as HTMLCanvasElement;
      if (canvas && imageNode) {
        const w = canvas.width / imageNode.getWidth();
        const h = canvas.height / imageNode.getHeight();
        let zoomFactor = w > h ? h : w;

        // todo: center texture in canvas
        this.dragZoom.centerImage(zoomFactor);
      } else {
        this.dragZoom.centerImage();
      }
    }

    reset() {
      this.dragZoom.centerImage();
      this.dragZoom.setImage(null);
    }

    hasImage() {
      return this.dragZoom && this.dragZoom.image != null;
    }
  }

  //https://stackoverflow.com/questions/10214873/make-canvas-as-wide-and-as-high-as-parent
  function fitCanvasToContainer(canvas) {
    if (!canvas) return;
    // Make it visually fill the positioned parent
    canvas.style.width = "100%";
    // 1em is the size of the top bar
    canvas.style.height = "100%";
    // ...then set the internal size to match
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    //canvas.height = canvas.offsetWidth;

    canvas.style.width = "auto";
    canvas.style.height = "auto";
  }
</script>
