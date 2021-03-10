<template>
  <div class="library-container">
    <div class style="padding-bottom:1em; display:flex; margin:0.5em;">
        <v-text-field label="Filter..." v-model="filter" />
    </div>
    <div id="app" class="node-list">
      <v-expansion-panels
        v-model="panel"
        multiple
        accordion
      >
        <v-expansion-panel
          v-for="(item,i) in items"
          :key="i">
          <v-expansion-panel-header>{{item.name}}</v-expansion-panel-header>
          <v-expansion-panel-content>
            <div style="overflow:hidden;">
              <span
                v-for="listItem in getFilteredListByName(item.name)"
                v-on:click="addItem(listItem.type, listItem.name)"
                v-on:dragstart="dragStart($event, listItem)"
                :key="listItem.name"
                class="libcard"
                href="#"
                draggable="true"
                width="33%"
              >
                <img
                  v-if="imageExists(listItem.name)"
                  v-bind:src="calcImagePath(listItem.name)"
                  class="thumbnail"
                />
                <div v-else class="thumbnail" />
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
import { Component, Prop, Model, Vue } from "vue-property-decorator";
import { Editor } from "@/lib/editor";
import { DesignerLibrary } from "@/lib/designer/library";
import { NodeCategory } from "@/lib/designer/designernode";
import fs from "fs";
import path from "path";
import Accordion from "@/components/Accordion.vue";
import { AddItemsAction } from "../lib/actions/additemsaction";
import { UndoStack } from "../lib/undostack";

declare let __static: any;

export enum LibraryItemCategory {
  Undefined = "undefined",
  Shape = "shape",
  Color = "color",
  Composite = "composite",
  Create = "create",
  Think = "think",
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

@Component({components:{Accordion}})
export default class LibraryView extends Vue {
  @Prop()
  library!: DesignerLibrary;

  @Prop()
  editor!: Editor;

  filter: string = "";

  items: any;
  
  panel: any;

  created () { 
    this.items = [
        {name: "Shape"},
        {name: "Color"},
        {name: "Composite"},
        {name: "Create"},
        {name: "Think"}
      ];
    
    this.panel = [...Array(this.items.length).keys()];
  }

  data () {
    return {
      panel: this.panel,
      items: this.items,
    }
  }

  get libItems() {
    let items = Object.values(this.library.nodes).map((n) => {
      let item = new LibraryItem(LibraryItemType.Node, n.category as LibraryItemCategory);
      item.name = n.name;
      item.displayName = n.displayName;

      return item;
    });

    items.push(new LibraryItem(LibraryItemType.Comment, LibraryItemCategory.Undefined, "comment", "Comment"));
    items.push(new LibraryItem(LibraryItemType.Frame, LibraryItemCategory.Undefined, "frame", "Frame"));
    // items.push(
    // 	new LibraryItem(
    // 		LibraryItemType.Navigation,
    // 		"navigation",
    // 		"Navigation"
    // 	)
    // );

    return items;
  }

  // get filteredList() {
  //   let kw = this.filter;
  //   let list = Object.values(this.libItems).filter(function(item) {
  //     return item.name.toLowerCase().includes(kw.toLowerCase());
  //   });
  //   return list;
  // }

  getFilteredListByName(name: string){
    return this.getFilteredList(name.toLowerCase() as LibraryItemCategory);
  }

  getFilteredList(category: LibraryItemCategory) {
    let kw = this.filter;
    let list = Object.values(this.libItems).filter(function(item) {
      return item.name.toLowerCase().includes(kw.toLowerCase()) && item.category === category;
    });
    return list;
  }

  addItem(type: LibraryItemType, nodeName: string) {
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
        "file://" + path.join(process.env.BASE_URL, `assets/nodes/${node}.png`)
      );
    return path.join(process.env.BASE_URL, `assets/nodes/${node}.png`);
  }

  mounted() {
    console.log(__static);
    console.log(process.env.BASE_URL);
  }
}
</script>
