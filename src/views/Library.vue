<template>
  <div class="library-container">
    <div class style="padding-bottom:1em; display:flex;margin:0.5em;">
      <div class="search-container">
        <input type="text" placeholder="Filter.." v-model="filter" />
      </div>
      <!-- <div class="size-container">
        <select>
          <option>Small Icons</option>
          <option>Medium Icons</option>
          <option>Large Icons</option>
          <option>Exra Large Icons</option>
        </select>
      </div>-->
    </div>
    <div class="node-list">
      <accordion header="Shape">
        <div style="overflow:hidden;">
          <span
            v-for="item in filteredListShape"
            v-on:click="addItem(item.type, item.name)"
            v-on:dragstart="dragStart($event, item)"
            :key="item.name"
            class="libcard"
            href="#"
            draggable="true"
            width="33%"
          >
            <img
              v-if="imageExists(item.name)"
              v-bind:src="calcImagePath(item.name)"
              class="thumbnail"
            />
            <div v-else class="thumbnail" />

            <div class="node-name">{{ item.displayName }}</div>
          </span>
        </div>
      </accordion>
      <accordion header="Color">
        <div style="overflow:hidden;">
          <span
            v-for="item in filteredListColor"
            v-on:click="addItem(item.type, item.name)"
            v-on:dragstart="dragStart($event, item)"
            :key="item.name"
            class="libcard"
            href="#"
            draggable="true"
          >
            <img
              v-if="imageExists(item.name)"
              v-bind:src="calcImagePath(item.name)"
              class="thumbnail"
            />
            <div v-else class="thumbnail" />

            <div class="node-name">{{ item.displayName }}</div>
          </span>
        </div>
      </accordion>
      <accordion header="Composite">
        <div style="overflow:hidden;">
          <span
            v-for="item in filteredListComposite"
            v-on:click="addItem(item.type, item.name)"
            v-on:dragstart="dragStart($event, item)"
            :key="item.name"
            class="libcard"
            href="#"
            draggable="true"
          >
            <img
              v-if="imageExists(item.name)"
              v-bind:src="calcImagePath(item.name)"
              class="thumbnail"
            />
            <div v-else class="thumbnail" />

            <div class="node-name">{{ item.displayName }}</div>
          </span>
        </div>
      </accordion>
      <accordion header="Create">
        <div style="overflow:hidden;">
          <span
            v-for="item in filteredListCreate"
            v-on:click="addItem(item.type, item.name)"
            v-on:dragstart="dragStart($event, item)"
            :key="item.name"
            class="libcard"
            href="#"
            draggable="true"
          >
            <img
              v-if="imageExists(item.name)"
              v-bind:src="calcImagePath(item.name)"
              class="thumbnail"
            />
            <div v-else class="thumbnail" />

            <div class="node-name">{{ item.displayName }}</div>
          </span>
        </div>
      </accordion>
      <accordion header="Think">
        <div style="overflow:hidden;">
          <span
            v-for="item in filteredListThink"
            v-on:click="addItem(item.type, item.name)"
            v-on:dragstart="dragStart($event, item)"
            :key="item.name"
            class="libcard"
            href="#"
            draggable="true"
          >
            <img
              v-if="imageExists(item.name)"
              v-bind:src="calcImagePath(item.name)"
              class="thumbnail"
            />
            <div v-else class="thumbnail" />

            <div class="node-name">{{ item.displayName }}</div>
          </span>
        </div>
      </accordion>
    </div>
  </div>
</template>

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

  created() {}

  get items() {
    let items = Object.values(this.library.nodes).map((n) => {
      let item = new LibraryItem(LibraryItemType.Node, <LibraryItemCategory>(n.category));
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

  get filteredList() {
    let kw = this.filter;
    let list = Object.values(this.items).filter(function(item) {
      return item.name.toLowerCase().includes(kw.toLowerCase());
    });
    return list;
  }

  get filteredListUndefined() {
    return this.getFilteredList(LibraryItemCategory.Undefined);
  }

  get filteredListShape() {
    return this.getFilteredList(LibraryItemCategory.Shape);
  }

  get filteredListColor() {
    return this.getFilteredList(LibraryItemCategory.Color);
  }

  get filteredListComposite() {
    return this.getFilteredList(LibraryItemCategory.Composite);
  }

  get filteredListCreate() {
    return this.getFilteredList(LibraryItemCategory.Create);
  }

  get filteredListThink() {
    return this.getFilteredList(LibraryItemCategory.Think);
  }

  getFilteredList(category: LibraryItemCategory) {
    let kw = this.filter;
    let list = Object.values(this.items).filter(function(item) {
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
      n.setCenter(200, 200);

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

<style scoped>
.libcard {
  width: 3rem;
  display: block;
  float: left;
  padding: 5px;
  cursor: pointer;
  border-radius: 4px;
}

.libcard:hover {
  background: rgb(0, 0, 0, 0.3);
}

.thumbnail {
  display: block;
  width: 3rem;
  height: 3rem;
  background: #ccc;
  border-radius: 4px;

  margin-left: -4px;
  border: solid rgba(0, 0, 0, 0.7) 4px;
}

.node-name {
  height: 3rem;
  line-height: 2rem;
  padding: 0;
  margin: 0;

  color: white;
  text-decoration: none;
}

.node-list {
  overflow-y: scroll;
  flex: 1 1 auto;
}

.search-container {
  flex-grow: 1;
}

.search-container input {
  /* width: calc(100% - 2em); */
  width: calc(100% - 0.5em) !important;
  padding: 0.5em;
  height: 1.5em;
  flex: 0 1 auto;
  padding: 4px;
  margin: 0;
  border-radius: 3px;
  /* border: solid #999 1px; */
  border: 0;
  color: white;
  background: #999;
  outline: none;
}

.size-container {
  flex-grow: 0;
  width: 100px;
}

.size-container select {
  width: 100%;
  height: 100%;
  border: solid white 1px;
  border-radius: 2px;
  color: white;
  background: #222;
  padding: 4px;
}

.library-container {
  overflow: hidden;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-flow: column;
}

</style>
