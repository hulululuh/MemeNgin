<template>
  <v-app>
    <v-system-bar app window clipped class="pl-0 pr-0 app-system-bar">
      <startup-menu ref="startupMenu" />
      <v-spacer />
      {{ this.title }}
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
      <tooltip-button
        icon="mdi-note-plus-outline"
        tooltip="New project"
        @click="openNewProjectDialog"
      />
      <tooltip-button
        icon="mdi-content-save-outline"
        tooltip="Save project"
        @click="saveProject"
        :disabled="!saveable"
      />
      <tooltip-button
        icon="mdi-content-save-edit-outline"
        tooltip="Save project as"
        @click="saveProjectAs"
      />
      <tooltip-button
        icon="mdi-folder-open-outline"
        tooltip="Open project"
        @click="openProject"
      />
      <tooltip-button icon="mdi-undo" tooltip="Undo" @click="undoAction" />
      <tooltip-button icon="mdi-redo" tooltip="Redo" @click="redoAction" />
      <tooltip-button
        icon="mdi-image-filter-center-focus-strong"
        tooltip="Zoom selection"
        @click="zoomSelection"
      />
      <v-spacer />
      <tooltip-button
        iconPath="assets/icons/Steam_Logo_Lockups_24dp.svg"
        tooltip="Publish item"
        @click="publishItem"
      />
      <tooltip-button
        icon="mdi-download"
        tooltip="Save as image"
        @click="saveTexture"
      />
      <tooltip-button
        icon="mdi-fit-to-page-outline"
        tooltip="Center texture"
        @click="centerTexture"
      />
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
      <v-card no-gutters style="max-height:calc(100% - 360px); overflow: auto;">
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
      <publish-dialog @onCancel="onCancelled" ref="publishDialog" />
      <close-dialog
        ref="closeDialog"
        @onSave="saveAndClose"
        @onClose="closeAnyway"
        @onCancel="onCancelled"
      />
      <project-name-dialog ref="projectNameDialog" />
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
  import TooltipButton from "@/views/TooltipButton.vue";
  import StartupMenu from "@/views/StartupMenu.vue";
  import CloseDialog from "@/views/CloseDialog.vue";
  import PublishDialog from "@/views/PublishDialog.vue";
  import ProjectNameDialog from "@/views/ProjectNameDialog.vue";
  import { DesignerLibrary } from "./lib/designer/library";
  import { Project, ProjectManager } from "./lib/project";
  import { MenuCommands } from "./menu";
  import fs from "fs";
  import path from "path";
  import { QueryTarget, UserData } from "@/userdata";
  import { IPropertyHolder } from "./lib/designer/properties";
  import { AddItemsAction } from "./lib/actions/additemsaction";
  import { UndoStack } from "./lib/undostack";
  import { ApplicationSettings } from "./settings";
  import { WorkshopManager } from "@/community/workshop";
  import { CloudData } from "@/clouddata";
  import { ProjectItemData } from "./community/ProjectItemData";

  const electron = require("electron");
  const remote = electron.remote;
  const { dialog } = remote;
  const app = remote.app;
  const userDataPath = path.join(app.getPath("userData"), "userData.json");
  //export const MY_WORKS_PATH = ApplicationSettings.getInstance().myWorksPath;

  export const MY_WORKS_PATH = path.join(
    path.resolve("."),
    "/projects/my_works/"
  );
  export const DEFAULT_WORKS_PATH = path.join(
    path.resolve("."),
    "/projects/default_works/"
  );

  declare let __static: any;

  @Component({
    components: {
      EditorView,
      LibraryView,
      NodePropertiesView,
      LibraryMenu,
      startupMenu: StartupMenu,
      preview2d: Preview2D,
      closeDialog: CloseDialog,
      tooltipButton: TooltipButton,
      publishDialog: PublishDialog,
      projectNameDialog: ProjectNameDialog,
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

    titleName: string = "";
    edited: boolean = false;

    constructor() {
      super();

      this.editor = Editor.getInstance();
      this.library = null;
      this.project = new Project();

      const remote = window.require ? window.require("electron").remote : null;
      const WIN = remote.getCurrentWindow();
      this.isMaximized = WIN.isMaximized();
    }

    get havePersistentDialog() {
      return (
        (this.$refs.closeDialog as CloseDialog).dialog ||
        (this.$refs.publishDialog as PublishDialog).dialog
      );
    }

    get title() {
      return this.edited ? `${this.titleName} *` : this.titleName;
    }

    get isEdited() {
      if (UndoStack.current) return UndoStack.current.pointer > -1;
      else return false;
    }

    created() {
      const shell = require("electron").shell;
      //open links externally by default
      $(document).on("click", 'a[href^="http"]', function(event) {
        event.preventDefault();
        //shell.openExternal(`${this.href}`);
        shell.openExternal(`steam://openurl/${this.href}`);
      });

      UserData.serialize();

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
        this.saveProjectAs();
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
      document.removeEventListener("editStarted", this.onEditStarted);
      document.removeEventListener("editEnded", this.onEditEnded);
      document.removeEventListener("projectSaved", this.onProjectSaved);
      document.removeEventListener("projectPublished", this.onProjectPublished);
    }

    onEditStarted() {
      this.edited = true;
      this.refreshTitle();
    }

    onEditEnded() {
      this.edited = false;
      this.refreshTitle();
      this.editor.refreshWidget();
    }

    refreshTitle() {
      if (remote) remote.getCurrentWindow().setTitle(this.title);
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

    onProjectSaved() {
      setTimeout(() => {
        CloudData.getInstance().getUserWorks();
      }, 1000);
    }

    onProjectPublished() {
      setTimeout(() => {
        WorkshopManager.getInstance().requestUpdate(QueryTarget.Search);
      }, 1000);
    }

    mounted() {
      this.setupMenu();

      window.addEventListener("resize", this.windowResize);
      document.addEventListener("editStarted", this.onEditStarted);
      document.addEventListener("editEnded", this.onEditEnded);
      document.addEventListener("projectSaved", this.onProjectSaved);
      document.addEventListener("projectPublished", this.onProjectPublished);

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

      this.editor.onnodeselected = (node) => {
        this.propHolder = node;
      };
      this.editor.oncommentselected = (comment) => {
        this.propHolder = comment;
        console.log("comment selected");
      };
      this.editor.onframeselected = (frame) => {};
      this.editor.onlibrarymenu = this.showLibraryMenu;

      // const _2dview = <HTMLCanvasElement>document.getElementById("_2dview");
      (this.$refs.preview2d as any).setEditor(this.editor);

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
      this.isMenuSetup = true;
    }

    showLibraryMenu() {
      // prevent showing library menu, when a program asks you important questions
      if (this.havePersistentDialog) return;

      // ensure mouse is in canvas bounds
      let lib = this.$refs.libraryMenu as any;
      console.log("show menu");
      if (lib.show == false) lib.showModal(this.mouseX, this.mouseY);
    }

    itemCreated(item: any) {
      // editor
      if (item.config.titleName == "Editor") {
        let container = item.container;
        item.container.on("resize", function() {
          const canvas = document.getElementById("editor") as HTMLCanvasElement;
          canvas.width = container.width;
          canvas.height = container.height;
        });
      }

      // 2d view
      if (item.config.titleName == "2D View") {
        let container = item.container;
        item.container.on("resize", () => {
          (this.$refs.preview2d as any).resize(
            container.width,
            container.height
          );
        });
      }
    }

    resizeCanvas() {
      console.log("resize!");
    }

    createProject(name: string) {
      this.newProject();
      this.editor.metadata.title = name;
      this.editor.metadata.localItem.isCloud = true;

      // make directory if not exists
      const targetDir = path.join(MY_WORKS_PATH, `/${name}/`);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      this.project.path = path.join(MY_WORKS_PATH, `/${name}/${name}.mmng`);
      this.project.name = name;
      this.titleName = this.project.name;

      // wait for scene is setup
      setTimeout(() => {
        this.saveProject(true);
      }, 0);
    }

    removeProject(itemData: ProjectItemData) {
      let success = WorkshopManager.getInstance().remove(itemData);
      if (success) {
        let isCloudItem = itemData.isCloud;
        // update cloud item list
        if (isCloudItem) {
          CloudData.getInstance().getUserWorks();
        }
      }

      // remove corresponding local files
      let targetPath = path.join(MY_WORKS_PATH, `/${itemData.title}/`);
      if (!fs.existsSync(targetPath) && itemData.localItem)
        targetPath = path.join(MY_WORKS_PATH, `/${itemData.localItem.path}/`);

      if (fs.existsSync(targetPath)) {
        fs.rmdirSync(targetPath, { recursive: true });
        console.info(`Local project ${targetPath} is removed`);
      }
    }

    openNewProjectDialog() {
      (this.$refs.projectNameDialog as ProjectNameDialog).dialog = true;
    }

    newProject() {
      // close startup menu if needed
      (this.$refs.startupMenu as StartupMenu).tryClose();

      // load default scene
      (this.$refs.preview2d as any).reset();

      // an empty scene
      this.editor.createEmptyScene();

      // reset states of all components
      (this.$refs.publishDialog as PublishDialog).reset();

      this.library = this.editor.library;

      this.project.name = "New MemeNgin Project";
      this.project.path = null;

      this.resolution = 1024;
      this.randomSeed = 32;

      this.titleName = "new project";
      this.edited = false;

      // todo: set titleName
    }

    get saveable() {
      return this.edited || this.project.path == null;
    }

    async saveAndClose() {
      if (!this.saveable) return;

      const remote = window.require ? window.require("electron").remote : null;
      const WIN = remote.getCurrentWindow();

      // trying to save new project
      if (!this.project.path) {
        let sucess = await this.saveProjectAs();
        if (sucess) WIN.close();
      } else {
        let data = this.editor.save();
        console.log(data);
        this.project.data = data;
        this.project.data["appVersion"] = this.version;
        ProjectManager.save(this.project.localPath, this.project);
        UndoStack.current.reset();
        this.edited = false;
        WIN.close();
      }
    }

    closeAnyway() {
      const remote = window.require ? window.require("electron").remote : null;
      const WIN = remote.getCurrentWindow();
      WIN.close();
    }

    onCancelled() {}

    saveProject(force: boolean = false) {
      if (!(force || this.saveable)) return;

      // trying to save new project
      if (!this.project.path) {
        this.saveProjectAs();
      } else {
        let data = this.editor.save();
        console.log(data);
        this.project.data = data;
        this.project.data["appVersion"] = this.version;

        ProjectManager.save(this.project.localPath, this.project);
        WorkshopManager.getInstance().create(this.project.localPath);
        UndoStack.current.reset();
        this.edited = false;

        document.dispatchEvent(new Event("projectSaved"));
      }
    }

    async saveProjectAs() {
      // if project has no name then it hasn't been saved yet
      try {
        let result = await dialog.showSaveDialog({
          filters: [
            {
              name: "MemeNgin Project",
              extensions: ["mmng"],
            },
          ],
          defaultPath: "material.mmng",
        });

        let filePath = result.filePath;
        if (!filePath) return false;
        let data = this.editor.save();
        console.log(data);
        this.project.data = data;
        this.project.data["appVersion"] = this.version;

        if (!filePath.endsWith(".mmng")) filePath += ".mmng";

        this.project.name = filePath.replace(/^.*[\\\/]/, "");
        this.project.path = filePath;

        ProjectManager.save(filePath, this.project);
        WorkshopManager.getInstance().create(this.project.localPath);
        this.titleName = this.project.name;
        remote.getCurrentWindow().setTitle(this.title);
        UndoStack.current.reset();
        document.dispatchEvent(new Event("projectSaved"));
        this.edited = false;
        return true;
      } catch (err) {
        console.warn("failed/rejected with", err);
        return false;
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
          this.openProjectWithPath(result.filePaths[0]);
        })
        .catch((...args) => {
          console.warn("failed/rejected with", args);
        });
    }

    async openProjectWithItem(data: ProjectItemData) {
      if (data.isCloud) {
        (this.$refs.startupMenu as StartupMenu).tryClose();
        let project = await ProjectManager.fromCloud(data.path);
        this.onProjectOpened(project);
      } else {
        this.openProjectWithPath(data.path);
      }
    }

    openProjectWithPath(filepath: string) {
      // close startup menu if needed
      (this.$refs.startupMenu as StartupMenu).tryClose();

      let project = ProjectManager.load(filepath);
      if (!project) return;

      this.onProjectOpened(project);
    }

    onProjectOpened(project: Project) {
      let userData: UserData = UserData.getInstance();
      userData.registerRecent(project.localPath);
      console.log(project);

      this.titleName = project.name;
      remote.getCurrentWindow().setTitle(this.title);
      this.editor.load(project.data);
      this.resolution = 1024;
      this.randomSeed = 32;

      this.project = project;
      this.library = this.editor.library;

      UndoStack.current.reset();
      this.edited = false;
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

    _openSample(filepath: string) {
      let project = ProjectManager.load(filepath);
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

      this.titleName = project.name;
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
      this.resolution = value;
      this.editor.designer.setTextureSize(value, value);
    }

    setRandomSeed(evt) {
      let seed = evt.target.value;
      this.randomSeed = seed;
      this.editor.designer.setRandomSeed(seed);
    }

    maximizeWindow() {
      if (this.havePersistentDialog) return;

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
      if (this.havePersistentDialog) return;

      UserData.deserialize();

      const remote = window.require ? window.require("electron").remote : null;
      const WIN = remote.getCurrentWindow();

      if (!this.edited) {
        WIN.close();
      } else {
        (this.$refs.closeDialog as CloseDialog).show();
      }
    }

    minimizeWindow() {
      if (this.havePersistentDialog) return;

      const remote = window.require ? window.require("electron").remote : null;
      const WIN = remote.getCurrentWindow();
      WIN.minimize();
    }

    publishItem() {
      if (this.havePersistentDialog) return;
      (this.$refs.publishDialog as PublishDialog).show();
    }

    saveTexture() {
      if (this.havePersistentDialog) return;
      (this.$refs.preview2d as Preview2D).saveTexture();
    }

    centerTexture() {
      if (this.havePersistentDialog) return;
      (this.$refs.preview2d as Preview2D).centerTexture();
    }
  }
</script>
