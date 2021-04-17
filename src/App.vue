<template>
  <v-app>
    <v-system-bar app window clipped class="pl-0 pr-0 app-system-bar">
      <startup-menu />

      <v-spacer />
      <v-btn class="system-bar-button" @click="minimizeWindow">
        <v-icon>mdi-minus</v-icon>
      </v-btn>
      <v-btn class="system-bar-button" @click="maximizeWindow">
        <v-icon v-if="isMaximized"> mdi-window-restore </v-icon>
        <v-icon v-if="!isMaximized"> mdi-window-maximize </v-icon>
      </v-btn>
      <v-btn class="system-bar-button" @click="closeWindow"
        ><v-icon>mdi-close</v-icon>
      </v-btn>
    </v-system-bar>

    <v-app-bar class="pa-0" app dense clipped-left clipped-right>
      <v-btn color="gray" @click="newProject">
        <v-icon>mdi-note-plus-outline</v-icon>
      </v-btn>
      <v-btn color="gray" @click="saveProject">
        <v-icon>mdi-content-save-outline</v-icon>
      </v-btn>
      <v-btn color="gray" @click="openProject">
        <v-icon>mdi-folder-open-outline</v-icon>
      </v-btn>
      <v-btn color="gray" @click="undoAction">
        <v-icon dark>
          mdi-undo
        </v-icon>
      </v-btn>
      <v-btn color="gray" @click="redoAction">
        <v-icon dark>
          mdi-redo
        </v-icon>
      </v-btn>
      <v-btn color="gray" @click="zoomSelection">
        <v-icon>mdi-image-filter-center-focus-strong</v-icon>
      </v-btn>
      <v-spacer />
      <v-btn @click="saveTexture">
        <v-icon> mdi-download </v-icon>
      </v-btn>
      <v-btn @click="centerTexture">
        <v-icon> mdi-fit-to-page-outline </v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer app clipped width="300">
      <library-view
        :editor="this.editor"
        :library="this.library"
        v-if="this.library != null"
      />
    </v-navigation-drawer>

    <v-navigation-drawer
      app
      flex
      fluid
      clipped
      right
      width="360"
      style="overflow: hidden;"
    >
      <v-card
        app
        clipped
        justify="center"
        align="end"
        style="overflow: hidden;"
      >
        <preview2d
          align="center"
          justify="center"
          ref="preview2d"
          style="width:360px !important; height:360px !important;"
          class="pa-2"
        />
      </v-card>
      <v-card no-gutters style="max-height:60%; overflow: auto;">
        <node-properties-view
          fluid
          align="start"
          class="d-flex"
          ref="properties"
          v-if="this.propHolder != null"
          :editor="this.editor"
          :node="this.propHolder"
        />
      </v-card>
    </v-navigation-drawer>

    <v-main>
      <v-container
        fluid
        flex
        clipped
        id="editor-view"
        class="pa-0 ma-0"
        v-resize="onResize"
      >
        <canvas
          class="pa-0 ma-0"
          id="editor"
          ondragover="event.preventDefault()"
        />
        <library-menu
          :editor="this.editor"
          :library="this.library"
          v-if="this.library != null"
          ref="libraryMenu"
        />
      </v-container>
    </v-main>
  </v-app>
</template>

<style lang="scss">
  @import "../public/scss/main.scss";
</style>

<style scoped lang="scss">
  @import "../public/scss/app.scss";
</style>

<script lang="ts">
  /* eslint-disable */
  import { Component, Vue } from "vue-property-decorator";
  import EditorView from "@/views/Editor.vue";
  import { Editor } from "@/lib/editor";
  import LibraryView from "@/views/Library.vue";
  import LibraryMenu from "@/components/LibraryMenu.vue";
  import NodePropertiesView from "@/views/NodeProperties.vue";
  import Preview2D from "@/views/Preview2D.vue";
  import StartupMenu from "@/views/StartupMenu.vue";
  import { DesignerLibrary } from "./lib/designer/library";
  import { Project, ProjectManager } from "./lib/project";
  import { MenuCommands } from "./menu";
  import path from "path";
  import { IPropertyHolder } from "./lib/designer/properties";
  import { AddItemsAction } from "./lib/actions/additemsaction";
  import { UndoStack } from "./lib/undostack";
  import { ApplicationSettings } from "./settings";

  const electron = require("electron");
  const remote = electron.remote;
  const { dialog } = require("electron").remote;

  declare let __static: any;

  @Component({
    components: {
      EditorView,
      LibraryView,
      NodePropertiesView,
      LibraryMenu,
      startupMenu: StartupMenu,
      preview2d: Preview2D,
    },
  })
  export default class App extends Vue {
    settings!: ApplicationSettings;
    editor!: Editor;
    library!: DesignerLibrary;

    propHolder: IPropertyHolder = null;

    project: Project;

    isMenuSetup: boolean = false;
    isMaximized: boolean = false;

    resolution: number = 1024;
    randomSeed: number = 32;

    mouseX: number = 0;
    mouseY: number = 0;

    version: string = "0.1.0";

    /// v-dialog
    dialog: boolean = false;
    notifications: boolean = false;
    sound: boolean = true;
    widgets: boolean = false;
    // v-dialog

    constructor() {
      super();

      this.editor = new Editor();
      this.library = null;

      this.project = new Project();

      const remote = window.require ? window.require("electron").remote : null;
      const WIN = remote.getCurrentWindow();
      this.isMaximized = WIN.isMaximized();
    }

    created() {
      electron.ipcRenderer.on(MenuCommands.FileNew, (evt, arg) => {
        this.newProject();
      });
      electron.ipcRenderer.on(MenuCommands.FileOpen, (evt, arg) => {
        this.openProject();
      });
      electron.ipcRenderer.on(MenuCommands.FileSave, (evt, arg) => {
        this.saveProject();
      });
      electron.ipcRenderer.on(MenuCommands.FileSaveAs, (evt, arg) => {
        this.saveProject(true);
      });

      electron.ipcRenderer.on(MenuCommands.EditUndo, async (evt, arg) => {
        this.undoAction();
      });
      electron.ipcRenderer.on(MenuCommands.EditRedo, async (evt, arg) => {
        this.redoAction();
      });

      electron.ipcRenderer.on(MenuCommands.EditCopy, async (evt, arg) => {
        document.execCommand("copy");
      });
      electron.ipcRenderer.on(MenuCommands.EditCut, async (evt, arg) => {
        document.execCommand("cut");
      });
      electron.ipcRenderer.on(MenuCommands.EditPaste, async (evt, arg) => {
        document.execCommand("paste");
      });

      electron.ipcRenderer.on(MenuCommands.HelpTutorials, (evt, arg) => {
        this.showTutorials();
      });
      electron.ipcRenderer.on(MenuCommands.HelpAbout, (evt, arg) => {
        this.showAboutDialog();
      });
      electron.ipcRenderer.on(MenuCommands.HelpSubmitBug, (evt, arg) => {
        this.submitBugs();
      });
    }

    destroyed() {
      window.removeEventListener("resize", this.windowResize);
    }

    windowResize() {
      const remote = window.require ? window.require("electron").remote : null;
      const WIN = remote.getCurrentWindow();
      this.isMaximized = WIN.isMaximized();
    }

    onResize() {
      const canvas = document.getElementById("editor") as HTMLCanvasElement;
      const view = document.getElementById("editor-view");
      canvas.width = view.clientWidth;
      canvas.height = view.clientHeight;
      let scene = this.editor.nodeScene;
      if (scene) {
        scene.view.onResized();
        scene.view.reset();
      }
    }

    mounted() {
      this.setupMenu();

      window.addEventListener("resize", this.windowResize);

      document.addEventListener("mousemove", (evt) => {
        this.mouseX = evt.pageX;
        this.mouseY = evt.pageY;
      });

      const canvas = document.getElementById("editor") as HTMLCanvasElement;
      canvas.ondrop = (evt) => {
        evt.preventDefault();

        let itemJson = evt.dataTransfer.getData("text/plain");
        let item = JSON.parse(itemJson);
        let rect = canvas.getBoundingClientRect();
        let pos = this.editor.nodeScene.view.canvasToSceneXY(
          evt.clientX - rect.left,
          evt.clientY - rect.top
        );

        let action: AddItemsAction = null;

        if (item.type == "node") {
          let nodeName = item.name;

          let dnode = this.library.create(nodeName);
          // let n = this.editor.addNode(
          // 	dnode,
          // 	evt.clientX - rect.left,
          // 	evt.clientY - rect.top
          // );
          let n = this.editor.addNode(dnode);
          n.setCenter(pos.x, pos.y);

          action = new AddItemsAction(
            this.editor.nodeScene,
            this.editor.designer,
            [],
            [],
            [],
            [],
            [n],
            [dnode]
          );
        } else if (item.type == "comment") {
          let d = this.editor.createComment();
          d.setCenter(pos.x, pos.y);

          action = new AddItemsAction(
            this.editor.nodeScene,
            this.editor.designer,
            [],
            [d],
            [],
            [],
            [],
            []
          );
        } else if (item.type == "frame") {
          let d = this.editor.createFrame();
          d.setCenter(pos.x, pos.y);

          action = new AddItemsAction(
            this.editor.nodeScene,
            this.editor.designer,
            [d],
            [],
            [],
            [],
            [],
            []
          );
        } else if (item.type == "navigation") {
          let d = this.editor.createNavigation();
          d.setCenter(pos.x, pos.y);

          action = new AddItemsAction(
            this.editor.nodeScene,
            this.editor.designer,
            [],
            [],
            [d],
            [],
            [],
            []
          );
        }

        if (action != null) {
          UndoStack.current.push(action);
        }
      };
      this.editor.setSceneCanvas(canvas);

      //this.designer = this.editor.designer;
      this.editor.onnodeselected = (node) => {
        //this.selectedNode = node;
        this.propHolder = node;
      };
      this.editor.oncommentselected = (comment) => {
        this.propHolder = comment;
        console.log("comment selected");
      };
      this.editor.onframeselected = (frame) => {
        //this.propHolder = frame;
      };
      // this.editor.onnavigationselected = nav => {
      //   this.propHolder = nav;
      // };
      this.editor.onlibrarymenu = this.showLibraryMenu;

      // const _2dview = <HTMLCanvasElement>document.getElementById("_2dview");
      // this.editor.set2DPreview(_2dview);
      (this.$refs.preview2d as any).setEditor(this.editor);

      // const _3dview = <HTMLCanvasElement>document.getElementById("_3dview");
      // this.view3d = new View3D();
      // this.view3d.setCanvas(_3dview);
      //this.editor.set3DScene(scene3D);
      //(this.$refs.preview3d as any).setEditor(this.editor);

      //this.editor.createNewTexture();
      this.newProject();

      // start animation
      const draw = () => {
        if (this.editor) {
          // might not be loaded as yet
          this.editor.update();
          this.editor.draw();
        }
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);

      // properly resize GL
      window.addEventListener("resize", () => {
        console.log(this.$refs.GL);
      });

      this.$nextTick(() => this.onResize());
    }

    undoAction() {
      if (document.activeElement instanceof HTMLElement)
        (document.activeElement as HTMLElement).blur();
      this.editor.undo();
    }

    redoAction() {
      if (document.activeElement instanceof HTMLElement)
        (document.activeElement as HTMLElement).blur();
      this.editor.redo();
    }

    setupMenu() {
      if (this.isMenuSetup) return;

      // let titleBar = new Titlebar({
      //   backgroundColor: Color.fromHex("#333333"),
      //   icon: "./favicon.svg",
      //   shadow: true
      // });

      this.isMenuSetup = true;
    }

    showLibraryMenu() {
      // ensure mouse is in canvas bounds
      //if (this.$refs.canvas.offset)
      let lib = this.$refs.libraryMenu as any;
      console.log("show menu");
      if (lib.show == false) lib.showModal(this.mouseX, this.mouseY);
    }

    itemCreated(item: any) {
      // editor
      if (item.config.title == "Editor") {
        let container = item.container;
        item.container.on("resize", function() {
          const canvas = document.getElementById("editor") as HTMLCanvasElement;
          canvas.width = container.width;
          canvas.height = container.height;
        });
      }

      // 2d view
      if (item.config.title == "2D View") {
        let container = item.container;
        item.container.on("resize", () => {
          // const canvas = <HTMLCanvasElement>document.getElementById("_2dview");
          // canvas.width = container.width;
          // canvas.height = container.height;

          (this.$refs.preview2d as any).resize(
            container.width,
            container.height
          );
        });
      }

      // // 3d view
      // if (item.config.title == "3D View") {
      //   let container = item.container;
      //   item.container.on("resize", () => {
      //     // const canvas = <HTMLCanvasElement>document.getElementById("_3dview");
      //     // canvas.width = container.width;
      //     // canvas.height = container.height;
      //     //if (this.view3d) this.view3d.resize(container.width, container.height);
      //     (this.$refs.preview3d as any).resize(container.width, container.height);
      //   });
      // }
    }

    resizeCanvas() {
      console.log("resize!");
    }

    newProject() {
      // reset states of all components
      // load default scene
      //(this.$refs.preview3d as any).reset();
      (this.$refs.preview2d as any).reset();

      // an empty scene
      this.editor.createEmptyScene();
      // default material scene
      //this.editor.createNewTexture();

      this.library = this.editor.library;

      this.project.name = "New MemeNgin Project";
      this.project.path = null;

      this.resolution = 1024;
      this.randomSeed = 32;

      // todo: set title
    }

    saveProject(saveAs: boolean = false) {
      // if project has no name then it hasnt been saved yet
      if (this.project.path == null || saveAs) {
        dialog
          .showSaveDialog({
            filters: [
              {
                name: "MemeNgin Project",
                extensions: ["mmng"],
              },
            ],
            defaultPath: "material.mmng",
          })
          .then((result) => {
            let path = result.filePath;
            if (!path) return;
            let data = this.editor.save();
            console.log(data);
            this.project.data = data;
            this.project.data["appVersion"] = this.version;

            //console.log(path);
            if (!path.endsWith(".mmng")) path += ".mmng";

            this.project.name = path.replace(/^.*[\\\/]/, "");
            this.project.path = path;

            ProjectManager.save(path, this.project);
            remote.getCurrentWindow().setTitle(this.project.name);
          })
          .catch((...args) => {
            console.warn("failed/rejected with", args);
          });
      } else {
        let data = this.editor.save();
        console.log(data);
        this.project.data = data;
        this.project.data["appVersion"] = this.version;
        ProjectManager.save(this.project.path, this.project);
      }
    }

    openProject() {
      // ask if current project should be saved
      dialog
        .showOpenDialog({
          filters: [
            {
              name: "MemeNgin Project",
              extensions: ["mmng"],
            },
          ],
          defaultPath: "material",
        })
        .then((result) => {
          let path = result.filePaths[0];
          let project = ProjectManager.load(path);
          console.log(project);

          remote.getCurrentWindow().setTitle(project.name);
          this.editor.load(project.data);
          this.resolution = 1024;
          this.randomSeed = 32;

          this.project = project;
          this.library = this.editor.library;
        })
        .catch((...args) => {
          console.warn("failed/rejected with", args);
        });
    }

    zoomSelection() {
      this.editor.nodeScene.zoomSelected(this.editor.nodeScene.selectedItems);
    }

    loadSample(name: string) {}

    showTutorials() {}

    showAboutDialog() {}

    submitBugs() {}

    openExample(fileName: string) {
      let fullPath = path.join(__static, "assets/examples/", fileName);

      this._openSample(fullPath);
    }

    _openSample(path: string) {
      let project = ProjectManager.load(path);
      console.log(project);

      // ensure library exists
      let libName = project.data["libraryVersion"];
      let libraries = ["v0", "v1"];
      if (libraries.indexOf(libName) == -1) {
        alert(
          `Project contains unknown library version '${libName}'. It must have been created with a new version of MemeNgin`
        );
        return;
      }

      remote.getCurrentWindow().setTitle(project.name);
      this.editor.load(project.data);
      this.resolution = 1024;
      this.randomSeed = 32;

      project.path = null; // this ensures saving pops SaveAs dialog
      this.project = project;
      this.library = this.editor.library;
    }

    setResolution(evt) {
      let value = parseInt(evt.target.value);
      //console.log(value);
      this.resolution = value;
      this.editor.designer.setTextureSize(value, value);
    }

    setRandomSeed(evt) {
      let seed = evt.target.value;
      this.randomSeed = seed;
      this.editor.designer.setRandomSeed(seed);
    }

    maximizeWindow() {
      const remote = window.require ? window.require("electron").remote : null;
      const WIN = remote.getCurrentWindow();

      if (!WIN.isMaximized()) {
        WIN.maximize();
        this.isMaximized = true;
      } else {
        WIN.unmaximize();
        this.isMaximized = false;
      }
    }

    closeWindow() {
      const remote = window.require ? window.require("electron").remote : null;
      const WIN = remote.getCurrentWindow();
      WIN.close();
    }

    minimizeWindow() {
      const remote = window.require ? window.require("electron").remote : null;
      const WIN = remote.getCurrentWindow();
      WIN.minimize();
    }

    saveTexture() {
      (this.$refs.preview2d as Preview2D).saveTexture();
    }

    centerTexture() {
      (this.$refs.preview2d as Preview2D).centerTexture();
    }
  }
</script>
