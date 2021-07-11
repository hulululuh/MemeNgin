<template>
  <div class="library-container">
    <div class style="padding-bottom:0em; display:flex; margin:0.5em;">
      <v-text-field hide-details label="Filter..." v-model="filter" />
    </div>
    <div id="app" class="node-list" style="overflow-x:hidden;">
      <v-expansion-panels v-model="panel" multiple accordion>
        <v-expansion-panel v-for="(item, i) in items" :key="i">
          <v-expansion-panel-header style="max-height:5px;" class="ml-1">
            {{ item.name }}
            <snackbar
              v-if="item.name == 'Experimental'"
              :text="textExperimental"
              :textClose="textClose"
              ref="snackbar"
            />
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <div style="overflow:hidden;">
              <span
                v-for="listItem in getFilteredListByName(item.name)"
                @click="addItem(listItem.type, listItem.name)"
                @dragstart="dragStart($event, listItem)"
                :key="listItem.name"
                class="libcard"
                href="#"
                draggable="true"
                width="33%"
              >
                <v-tooltip bottom max-width="300">
                  <template v-slot:activator="{ on, attrs }">
                    <img
                      v-if="imageExists(listItem.name)"
                      v-bind:src="calcImagePath(listItem.name)"
                      class="thumbnail"
                      v-bind="attrs"
                      v-on="on"
                    />
                    <div v-else class="thumbnail" v-bind="attrs" v-on="on" />
                  </template>
                  <span width>{{ listItem.name }}</span>
                </v-tooltip>
              </span>
            </div>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
</template>

<style scoped lang="scss">
  @import "../../public/scss/library.scss";
</style>

<script lang="ts">
  import { Component, Prop, Vue } from "vue-property-decorator";
  import { Editor } from "@/lib/editor";
  import { DesignerLibrary } from "@/lib/designer/library";
  import fs from "fs";
  import path from "path";
  import Accordion from "@/components/Accordion.vue";
  import Snackbar from "@/views/Snackbar.vue";
  import { AddItemsAction } from "../lib/actions/additemsaction";
  import { UndoStack } from "../lib/undostack";
  import { TextManager } from "@/assets/textmanager";

  declare let __static: any;

  export enum LibraryItemCategory {
    Undefined = "undefined",
    Shape = "shape",
    Color = "color",
    Composite = "composite",
    Create = "create",
    Logic = "logic",
    Control = "control",
    Experimental = "experimental",
  }

  // this abstracts library nodes and other items such as comments
  export enum LibraryItemType {
    Node = "node",
    Comment = "comment",
    Frame = "frame",
    Navigation = "navigation",
  }

  export class LibraryItem {
    type: LibraryItemType;
    category: LibraryItemCategory;
    name: string;
    displayName: string;

    constructor(
      type: LibraryItemType,
      category: LibraryItemCategory = LibraryItemCategory.Undefined,
      name: string = "",
      displayName: string = ""
    ) {
      this.type = type;
      this.category = category;
      this.name = name;
      this.displayName = displayName;
    }
  }

  @Component({
    components: { Accordion, Snackbar },
  })
  export default class LibraryView extends Vue {
    @Prop() library!: DesignerLibrary;
    @Prop() editor!: Editor;

    filter: string = "";

    items: any;

    panel: any;

    created() {
      this.items = [
        { name: "Shape" },
        { name: "Color" },
        { name: "Composite" },
        { name: "Create" },
        { name: "Logic" },
        { name: "Control" },
        { name: "Experimental" },
      ];

      this.panel = [...Array(this.items.length).keys()];
    }

    data() {
      return {
        panel: this.panel,
        items: this.items,
      };
    }

    get textClose() {
      return TextManager.translate("${ui_general.close}");
    }

    get textExperimental() {
      return TextManager.translate("${experimental}");
    }

    get libItems() {
      let items = Object.values(this.library.nodes).map((n) => {
        let item = new LibraryItem(
          LibraryItemType.Node,
          n.category as LibraryItemCategory
        );
        item.name = n.name;
        item.displayName = n.displayName;

        return item;
      });

      // input
      let idx = items.findIndex((item) => item.name.toLowerCase() === "output");
      if (idx > -1) {
        items.splice(
          idx,
          0,
          new LibraryItem(
            LibraryItemType.Frame,
            LibraryItemCategory.Control,
            "inputs",
            "Inputs"
          )
        );
      }

      items.push(
        new LibraryItem(
          LibraryItemType.Comment,
          LibraryItemCategory.Control,
          "comment",
          "Comment"
        )
      );

      return items;
    }

    getFilteredListByName(name: string) {
      return this.getFilteredList(name.toLowerCase() as LibraryItemCategory);
    }

    getFilteredList(category: LibraryItemCategory) {
      let kw = this.filter;
      let list = Object.values(this.libItems).filter(function(item) {
        return (
          item.name.toLowerCase().includes(kw.toLowerCase()) &&
          item.category === category
        );
      });
      return list;
    }

    addItem(type: LibraryItemType, nodeName: string) {
      if (nodeName == "inputs") {
        this.editor.nodeScene.oninputnodecreationattempt();
        return;
      }
      if (nodeName == "output") {
        // only one output node is exists
        this.editor.nodeScene.onoutputnodecreationattempt();
        return;
      }

      let action: AddItemsAction = null;

      if (type == LibraryItemType.Node) {
        let dnode = this.library.create(nodeName);
        let canvas = this.editor.canvas;
        let n = this.editor.addNode(dnode, canvas.width / 2, canvas.height / 2);

        const viewCenter = this.editor.nodeScene.view.sceneCenter;
        n.setCenter(viewCenter[0], viewCenter[1]);

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
      }
      if (type == LibraryItemType.Comment) {
        let item = this.editor.createComment();
        //item.setCenter(200, 200);
        action = new AddItemsAction(
          this.editor.nodeScene,
          this.editor.designer,
          [],
          [item],
          [],
          [],
          [],
          []
        );
      }
      if (type == LibraryItemType.Frame) {
        let item = this.editor.createFrame();
        //item.setCenter(200, 200);
        action = new AddItemsAction(
          this.editor.nodeScene,
          this.editor.designer,
          [item],
          [],
          [],
          [],
          [],
          []
        );
      }
      if (type == LibraryItemType.Navigation) {
        let item = this.editor.createNavigation();
        //item.setCenter(200, 200);
        action = new AddItemsAction(
          this.editor.nodeScene,
          this.editor.designer,
          [],
          [],
          [item],
          [],
          [],
          []
        );
      }

      if (action != null) {
        UndoStack.current.push(action);
      }

      return false;
    }

    dragStart(evt: any, item: any) {
      evt.dataTransfer.setData("text/plain", JSON.stringify(item));
    }

    imageExists(node: string) {
      //return fs.existsSync(`./public/assets/nodes/${node}.png`);
      return fs.existsSync(path.join(__static, `assets/nodes/${node}.png`));
    }

    calcImagePath(node: string) {
      //return `./assets/nodes/${node}.png`;
      if (process.env.NODE_ENV == "production")
        return (
          "file://" +
          path.join(process.env.BASE_URL, `assets/nodes/${node}.png`)
        );
      return path.join(process.env.BASE_URL, `assets/nodes/${node}.png`);
    }

    mounted() {
      console.log(__static);
      console.log(process.env.BASE_URL);
    }
  }
</script>
