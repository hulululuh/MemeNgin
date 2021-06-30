<template v-on:change="onChanged">
  <v-hover v-slot="{ hover }">
    <v-card
      class="pa-0 ma-0 d-flex flex-wrap"
      min-width="192px"
      max-width="256px"
      :aspect-ratio="1"
      :elevation="hover ? 16 : 2"
      :class="{ 'on-hover': hover }"
      @click="open"
    >
      <v-img
        id="thumbnail"
        class="white--text align-center"
        style="text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
        v-bind:src="thumbnail"
        lazy-src="assets/icons/image.svg"
      >
        <div>
          <v-scale-transition>
            <v-btn
              style="position:absolute; right: 0px; top: 0px;"
              fab
              x-small
              v-show="hover"
              justify-right
              @click.stop="remove"
            >
              <v-icon> mdi-delete</v-icon>
            </v-btn>
          </v-scale-transition>
        </div>
        <v-card-title class="justify-center" fluid style="font-size:18px">
          {{ itemData.title }}
        </v-card-title>

        <v-expand-transition>
          <div
            v-if="hover"
            class="transition-fast-in-fast-out v-card--reveal"
            style="height: 35%; background-color: rgba(255, 255, 255, 0.42); font-size:13px; font-weight: bold;
              text-shadow: none; color:#000; line-height: 1.125;"
          >
            {{ description }}
          </div>
        </v-expand-transition>
      </v-img>
    </v-card>
  </v-hover>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Prop, Component } from "vue-property-decorator";
  import { ProjectItemData } from "@/community/ProjectItemData";
  import App from "@/App.vue";

  @Component
  export default class ProjectItem extends Vue {
    @Prop() itemData: ProjectItemData;

    open() {
      console.log("tried to open");
      (this.$root.$children[0] as App).openProjectWithItem(this.itemData);
    }

    remove() {
      (this.$root.$children[0] as App).removeProject(this.itemData);
    }

    get thumbnail() {
      return this.itemData.thumbnail;
    }

    get description() {
      return this.itemData.description
        ? this.itemData.description.substring(0, 200)
        : "";
    }
  }
</script>
