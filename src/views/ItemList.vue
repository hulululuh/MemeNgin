<template>
  <v-flex class="pa-2" style="overflow-y: hide;">
    <v-subheader style="font-size: 1rem; font-weight: 400;">{{
      categoryName
    }}</v-subheader>
    <v-divider />
    <v-row class="grid pa-1">
      <v-col
        v-for="item in lists"
        :key="item"
        cols="auto"
        md="auto"
        class="pa-1"
      >
        <project-item :path="item" />
      </v-col>
    </v-row>
  </v-flex>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Prop, Component } from "vue-property-decorator";
  import ProjectItem from "@/views/ProjectItem.vue";

  @Component({
    components: {
      projectItem: ProjectItem,
    },
  })
  export default class ItemList extends Vue {
    @Prop() categoryName: string;
    @Prop() lists: string[];
  }
</script>
