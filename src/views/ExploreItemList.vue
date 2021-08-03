<template>
  <v-flex class="pa-2" style="overflow-y: hide;">
    <v-subheader style="font-size: 1rem; font-weight: 400;">{{
      categoryName
    }}</v-subheader>
    <v-divider class="mt-0 pb-2" />
    <v-list>
      <v-list-item-group v-model="selectedItem" class="grid pa-1">
        <v-list-item v-for="(item, i) in lists" :key="i" class="pa-0 ma-0">
          <project-item
            v-if="exists(item)"
            :active="i == selectedItem"
            :itemData="item"
            :clickAction="clickAction"
            :deleteAction="deleteAction"
            :readonly="readonly"
          />
        </v-list-item>
      </v-list-item-group>
    </v-list>
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

  @Component({
    components: {
      projectItem: ProjectItem,
    },
  })
  export default class ExploreItemList extends Vue {
    @Prop() categoryName: string;
    @Prop() lists: Array<ProjectItemData>;
    @Prop() deleteAction: DeleteAction;
    @Prop() readonly: boolean;

    selectedItem: number = -1;

    exists(item: ProjectItemData) {
      return item.isValid;
    }

    get clickAction() {
      return ClickAction.Select;
    }
  }
</script>
