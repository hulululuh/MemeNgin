<template>
  <v-container>
    <v-flex>
      <v-btn @click="saveTexture">
        <v-img src="assets/icons/save_alt_black_24dp.svg"> </v-img>
      </v-btn>
      <v-btn @click="centerTexture">
        <v-img src="assets/icons/fit_screen-24px.svg"> </v-img>
      </v-btn>
    </v-flex>
    <v-flex fill-height justify-center v-resize="resize" ref="flex">
      <canvas id="_2dpreview" ref="canvas"></canvas>
    </v-flex>
  </v-container>
</template>

<script>
  import { Component, Vue } from "vue-property-decorator";
  import { DragZoom } from "./preview2d/previewcanvas2d";
  const electron = require("electron");
  const remote = electron.remote;
  const { dialog } = remote;
  import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

  @Component
  export default class Preview2D extends Vue {
    // props: {
    //   editor: {
    //     type: Object
    //   }
    // },
    data() {
      return {
        node: null,
        // HtmlCanvasElement...it will auto update when the node's image changes
        image: null,
        canvas: null,
        dragZoom: null,
        flex: null,
      };
    }
    mounted() {
      let dragZoom = new DragZoom(this.$refs.canvas);
      const draw = () => {
        dragZoom.draw();
        requestAnimationFrame(draw);
      };

      requestAnimationFrame(draw);
      this.dragZoom = dragZoom;

      document.addEventListener("resizeImage", (event) => {
        this.dragZoom.width = event.detail.width;
        this.dragZoom.height = event.detail.height;
        this.resizeImage(event.detail.width, event.detail.height);
      });
    }
    setEditor(editor) {
      this.editor = editor;
      let self = this;
      editor.onpreviewnode = (node, image) => {
        self.node = node;
        self.image = image;

        self.dragZoom.setImage(image);

        if (node instanceof ImageDesignerNode) {
          const margin = 0.1;
          const ratioW =
            ((1.0 - margin) * this.$refs.canvas.width) / node.getWidth();
          const ratioH =
            ((1.0 - margin) * this.$refs.canvas.height) / node.getHeight();

          const zoomFactor = Math.min(1.0, Math.min(ratioW, ratioH));
          self.dragZoom.centerImage(zoomFactor);
        }
      };
    }
    resize(width, height) {
      width = this.$refs.flex.clientWidth;
      height = this.$refs.flex.clientHeight;
      fitCanvasToContainer(this.$refs.canvas);
      if (!this.dragZoom) {
        this.dragZoom = new DragZoom(this.$refs.canvas);
      }
      this.dragZoom.onResize(width, height);
    }
    resizeImage(width, height) {
      fitCanvasToContainer(this.$refs.canvas);

      const margin = 0.1;
      const ratioW = ((1.0 - margin) * this.$refs.canvas.width) / width;
      const ratioH = ((1.0 - margin) * this.$refs.canvas.height) / height;

      const zoomFactor = Math.min(1.0, Math.min(ratioW, ratioH));
      this.dragZoom.centerImage(zoomFactor);
    }
    paint() {
      if (!this.image) return;

      let canvas = this.$refs.canvas;
      let ctx = canvas.getContext("2d");

      ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);
    }
    saveTexture() {
      // todo: save image as png
      //console.log(this.hasImage);
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

          fs.writeFile(path, buffer, function(err) {
            //console.log(err);
            if (err) alert("Error saving image: " + err);
          });
        });
    }
    centerTexture() {
      if (this.$refs.canvas && this.node) {
        const w = this.$refs.canvas.width / this.node.getWidth();
        const h = this.$refs.canvas.height / this.node.getHeight();
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
    // Make it visually fill the positioned parent
    canvas.style.width = "100%";
    // 1em is the size of the top bar
    canvas.style.height = "calc(100% - 2em)";
    // ...then set the internal size to match
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    //canvas.height = canvas.offsetWidth;

    canvas.style.width = "auto";
    canvas.style.height = "auto";
  }
</script>

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
</style>
