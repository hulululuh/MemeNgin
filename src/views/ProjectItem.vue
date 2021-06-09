<template v-on:change="onChanged">
  <v-hover v-slot="{ hover }">
    <v-card
      width="192px"
      :elevation="hover ? 16 : 2"
      :class="{ 'on-hover': hover }"
    >
      <v-img
        id="thumbnail"
        class="white--text align-center"
        style="text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;"
        height="192px"
        v-bind:src="thumbnail"
        lazy-src="assets/icons/image.svg"
        @click="open"
      >
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
            {{ itemData.description.substring(0, 200) }}
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
  import App from "../App.vue";

  @Component
  export default class ProjectItem extends Vue {
    @Prop() itemData: ProjectItemData;

    open() {
      console.log("tried to open");
      (this.$root.$children[0] as App).openProjectWithPath(
        this.itemData.localPath
      );
    }

    get thumbnail() {
      return this.itemData.thumbnail;
    }
  }
</script>
