<template>
  <v-flex class="pa-2" style="overflow-y: hide;">
    <v-subheader style="font-size: 1rem; font-weight: 400;">{{
      categoryName
    }}</v-subheader>
    <v-divider class="mt-0 pb-2" />
    <v-row class="grid pa-1">
      <new-document v-if="newDocument" />
      <v-col v-for="(item, i) in lists" :key="i" class="pa-1">
        <project-item
          v-if="exists(item)"
          :itemData="item"
          :clickAction="clickAction"
          :deleteAction="deleteAction"
        />
      </v-col>
    </v-row>
  </v-flex>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Prop, Component } from "vue-property-decorator";
  import { ProjectItemData } from "@/community/ProjectItemData";
  import ProjectItem, {
    ClickAction,
    DeleteAction,
  } from "@/views/ProjectItem.vue";
  import NewDocument from "@/views/NewDocument.vue";

  @Component({
    components: {
      projectItem: ProjectItem,
      newDocument: NewDocument,
    },
  })
  export default class ItemList extends Vue {
    @Prop() newDocument: boolean;
    @Prop() categoryName: string;
    @Prop() lists: ProjectItemData[];
    @Prop() deleteAction: DeleteAction;

    exists(item: ProjectItemData) {
      return item.isValid;
    }

    get clickAction() {
      return ClickAction.Open;
    }
  }
</script>
