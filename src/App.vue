<template>
  <v-app>
    <v-system-bar app window clipped class="pl-0 pr-0 app-system-bar">
      <startup-menu ref="startupMenu" />
      <v-spacer />
      {{ this.title }}
      <v-spacer />
      <v-btn fab icon x-small class="system-bar-button" @click="showTutorials">
        <v-img :src="tutorialIcon"> </v-img>
      </v-btn>
      <v-btn fab icon x-small class="system-bar-button" @click="showLanguages">
        <country-flag :country="language" size="normal" :rounded="true" />
      </v-btn>
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
      <tooltip-button
        icon="mdi-undo"
        tooltip="Undo"
        @click="undoAction"
        :disabled="!undoable"
      />
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
      <language-dialog ref="languageDialog" />
      <tutorial-dialog ref="tutorialDialog" />
      <message-dialog ref="messageDialog" />
      <publish-dialog @onCancel="onCancelled" ref="publishDialog" />
      <close-dialog
        ref="closeDialog"
        @onSave="saveAndClose"
        @onClose="close"
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
  import MessageDialog from "@/views/MessageDialog.vue";
  import PublishDialog from "@/views/PublishDialog.vue";
  import ProjectNameDialog from "@/views/ProjectNameDialog.vue";
  import { DesignerLibrary } from "./lib/designer/library";
  import { Project, ProjectManager } from "./lib/project";
  import { MenuCommands } from "./menu";
  import fs from "fs";
  import path from "path";
  import { QueryTarget, UserData } from "@/userdata";
  import { IPropertyHolder } from "./lib/designer/properties";
  import { TextManager, LANGUAGES } from "@/assets/textmanager";
  import { UndoStack } from "./lib/undostack";
  import { ApplicationSettings } from "./settings";
  import { WorkshopManager } from "@/community/workshop";
  import { CloudData } from "@/clouddata";
  import { ProjectItemData } from "./community/ProjectItemData";
  import {
    DeleteAction,
    ProjectItemDeleteEvent,
  } from "@/views/ProjectItem.vue";
  import TutorialDialog from "@/views/TutorialDialog.vue";
  import LanguageDialog from "@/views/LanguageDialog.vue";
  import { PUBLISH_TEMP_PATH } from "@/lib/project";
  import {
    TEMP_PATH,
    RESOURCE_PATH,
    MY_WORKS_PATH,
    isInsideReservedPath,
  } from "@/lib/utils";
  import CountryFlag from "vue-country-flag";

  const fsExtra = require("fs-extra");
  const electron = require("electron");
  const remote = electron.remote;
  const { dialog } = remote;
  const app = remote.app;
  const userDataPath = path.join(app.getPath("userData"), "userData.json");

  declare let __static: any;

  @Component({
    components: {
      EditorView,
      LibraryView,
      NodePropertiesView,
      LibraryMenu,
      CountryFlag,
      startupMenu: StartupMenu,
      preview2d: Preview2D,
      closeDialog: CloseDialog,
      messageDialog: MessageDialog,
      tooltipButton: TooltipButton,
      publishDialog: PublishDialog,
      projectNameDialog: ProjectNameDialog,
      tutorialDialog: TutorialDialog,
      languageDialog: LanguageDialog,
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
    isReadOnly: boolean = false;

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
        (this.$refs.languageDialog as StartupMenu).dialog ||
        (this.$refs.closeDialog as CloseDialog).dialog ||
        (this.$refs.publishDialog as PublishDialog).dialog ||
        (this.$refs.startupMenu as StartupMenu).dialog
      );
    }

    get title() {
      return this.edited ? `${this.titleName} *` : this.titleName;
    }

    get tutorialIcon() {
      return "assets/icons/comment-question-outline.svg";
    }

    get undoable() {
      const current = this.$store.state.undoStack;
      return current ? current.pointer > -1 : false;
    }

    get language() {
      const lanId = UserData.getInstance().languageId;
      return LANGUAGES[lanId].region;
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
      WorkshopManager.getInstance().refresh();

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
      electron.ipcRenderer.on(MenuCommands.FileExit, (evt, arg) => {
        this.closeWindow();
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
      document.removeEventListener("publishRequested", this.onPublishRequested);
      document.removeEventListener("projectPublished", this.onProjectPublished);
      document.removeEventListener(
        "projectItemDelete",
        this.onProjectItemDelete
      );
      document.removeEventListener("mousemove", this.onMouseMove);
      document.removeEventListener("metadataChanged", this.onMetadataChanged);
      document.removeEventListener("undo", this.undoAction);
      document.removeEventListener("redo", this.redoAction);
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

    async refreshSelectedItem() {
      this.$store.state.selectedProjectState = await WorkshopManager.getInstance().getItemState(
        this.$store.state.selectedProject.workshopItem.publishedFileId
      );
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
        scene.resetView();
      }
    }

    onProjectSaved() {
      setTimeout(() => {
        CloudData.getInstance().getUserWorks();
      }, 1000);
    }

    onProjectPublished() {
      setTimeout(() => {
        WorkshopManager.getInstance().requestSearch(
          this.$store.state.userData.searchOption,
          QueryTarget.Search
        );
      }, 1000);
    }

    mounted() {
      this.setupMenu();

      window.addEventListener("resize", this.windowResize);
      document.addEventListener("editStarted", this.onEditStarted);
      document.addEventListener("editEnded", this.onEditEnded);
      document.addEventListener("projectSaved", this.onProjectSaved);
      document.addEventListener("projectPublished", this.onProjectPublished);
      document.addEventListener("publishRequested", this.onPublishRequested);
      document.addEventListener("projectItemDelete", this.onProjectItemDelete);
      document.addEventListener("mousemove", this.onMouseMove);
      document.addEventListener("metadataChanged", this.onMetadataChanged);
      document.addEventListener("undo", this.undoAction);
      document.addEventListener("redo", this.redoAction);

      const canvas = document.getElementById("editor") as HTMLCanvasElement;
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

      if (!UserData.getInstance().dontShowIntroAgain) {
        (this.$refs.tutorialDialog as TutorialDialog).dialog = true;
      }
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
      this.$store.state.metadata.title = name;
      this.$store.state.metadata.localItem.isCloud = true;

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
      return !this.isReadOnly && (this.edited || this.project.path == null);
    }

    async saveAndClose() {
      if (!this.saveable) return;

      const remote = window.require ? window.require("electron").remote : null;
      const WIN = remote.getCurrentWindow();

      // trying to save new project
      if (!this.project.path) {
        let sucess = await this.saveProjectAs();
        if (sucess) this.close();
      } else {
        let data = this.editor.save();
        console.log(data);
        this.project.data = data;
        this.project.data["appVersion"] = this.version;
        ProjectManager.save(this.project.localPath, this.project);
        UndoStack.current.reset();
        this.edited = false;
        this.close();
      }
    }

    close() {
      const remote = window.require ? window.require("electron").remote : null;
      const WIN = remote.getCurrentWindow();
      WIN.close();
    }

    onCancelled() {}

    async onPublishRequested() {
      const app = this;
      const projectPath = app.project.localPath;
      // save changes
      app.saveProject(true);

      // move current project to temp path
      if (!fs.existsSync(PUBLISH_TEMP_PATH)) {
        fs.mkdirSync(PUBLISH_TEMP_PATH, { recursive: true });
      }

      // cleanup temp folder
      fsExtra.emptyDirSync(PUBLISH_TEMP_PATH);

      const dest = path.join(
        PUBLISH_TEMP_PATH,
        path.parse(app.project.path).base
      );
      fs.copyFileSync(projectPath, dest);

      // make thumbnail file
      // publish items
      let success = await WorkshopManager.getInstance().publish(dest);

      // save issued item id, publisher id and so on.
      if (success) {
        document.dispatchEvent(new Event("projectPublished"));

        const title = TextManager.translate("${ui_general.success}");
        const message = TextManager.translate("${publish_dialog.success}");
        const close = TextManager.translate("${ui_general.okay}");
        app.showMessage(title, message, close);
      } else {
        const title = TextManager.translate("${ui_general.fail}");
        const message = TextManager.translate("${publish_dialog.fail}");
        const close = TextManager.translate("${ui_general.close}");
        app.showMessage(title, message, close);
      }
    }

    onProjectItemDelete(evt: ProjectItemDeleteEvent) {
      const item = evt.detail.item;
      const deleteAction = evt.detail.action;

      if (deleteAction == DeleteAction.Unlist) {
        UserData.getInstance().removeRecent(item.path);
      } else if (deleteAction == DeleteAction.Cloud) {
        this.removeProject(item);
      } else if (deleteAction == DeleteAction.Unsubscribe) {
        if (item.workshopItem) {
          WorkshopManager.getInstance().unsubscribe(
            item.workshopItem.publishedFileId
          );
        } else {
          console.warn(`You are trying to unsubscribe invalid item.`);
        }
      }
    }

    onMouseMove(evt) {
      this.mouseX = evt.pageX;
      this.mouseY = evt.pageY;
    }

    onMetadataChanged() {
      this.edited = true;
    }

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
      this.isReadOnly = data.isOthersWork;
      this.updatePublisherInfo(data.workshopItem.publisherId);

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
      if (fs.existsSync(project.localPath)) {
        userData.registerRecent(project.localPath);
      }

      this.titleName = project.name;
      remote.getCurrentWindow().setTitle(this.title);
      this.editor.load(project.data);
      this.resolution = 1024;
      this.randomSeed = 32;

      this.project = project;
      this.library = this.editor.library;

      UndoStack.current.reset();
      this.edited = false;

      if (isInsideReservedPath(project.localPath)) {
        this.isReadOnly = true;
      }
    }

    async updatePublisherInfo(publisherId) {
      if (!publisherId || publisherId.length == 0) return;
      WorkshopManager.getInstance().requestUserInfo(publisherId);
      await new Promise((resolve) => setTimeout(resolve, 200));
      this.$store.state.currentProjectAuthorName = WorkshopManager.getInstance().getAuthorName(
        publisherId
      );
      this.$store.state.currentProjectAuthorAvatar = WorkshopManager.getInstance().getAuthorAvatar(
        publisherId
      );
    }

    zoomSelection() {
      this.editor.nodeScene.zoomSelected(this.editor.nodeScene.selectedItems);
    }

    loadSample(name: string) {}

    showLanguages() {
      (this.$refs.languageDialog as LanguageDialog).dialog = true;
    }

    showTutorials() {
      (this.$refs.tutorialDialog as TutorialDialog).dialog = true;
    }

    showAboutDialog() {}

    submitBugs() {}

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

      if (!this.edited) {
        this.close();
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

    showMessage(title: string, message: string, close: string) {
      const msgDialog = this.$refs.messageDialog as MessageDialog;
      msgDialog.textTitle = title;
      msgDialog.textMessage = message;
      msgDialog.textClose = close;
      msgDialog.show();
    }
  }
</script>
