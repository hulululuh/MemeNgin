<template>
  <v-hover v-slot="{ hover }">
    <v-card
      width="192px"
      :elevation="hover ? 16 : 2"
      :class="{ 'on-hover': hover }"
    >
      <v-img
        id="thumbnail"
        class="white--text align-center"
        style=" text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;"
        height="192px"
        v-bind:src="thumbnail"
        lazy-src="assets/icons/image.svg"
        @click="open"
      >
        <v-card-title class="justify-center" fluid>
          {{ filename }}
        </v-card-title>

        <v-expand-transition>
          <div
            v-if="hover"
            class="d-flex transition-fast-in-fast-out v-card--reveal"
            style="height: 35%; background-color: rgba(255, 255, 255, 0.3);"
          >
            {{ description }}
          </div>
        </v-expand-transition>

        <!-- <v-card-title class="justify-center" fluid>
          {{ filename }}
        </v-card-title>

        <v-expand-transition>
          <v-card
            v-show="hover"
            height="100px"
            style="background-color: rgba(255, 255, 255, 0.5); text-shadow: none; height: 100%;"
          >
            {{ description }}
          </v-card>
        </v-expand-transition> -->
      </v-img>
    </v-card>
  </v-hover>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Prop, Component } from "vue-property-decorator";
  import { ProjectManager } from "@/lib/project";
  import path from "path";
  import App from "../App.vue";

  @Component
  export default class ProjectItem extends Vue {
    @Prop() path!: string;
    thumbnail: any;
    data: any;

    created() {
      let project = ProjectManager.load(this.path);
      if (project) {
        this.data = project.data;
        this.thumbnail = this.data["thumbnail"];
      }
    }

    open() {
      console.log("tried to open");
      (this.$root.$children[0] as App).openProjectWithPath(this.path);
    }

    get filename() {
      return path.parse(this.path).name;
    }

    get description() {
      if (this.data) return this.data["description"];
      else return "";
    }
  }
</script>
