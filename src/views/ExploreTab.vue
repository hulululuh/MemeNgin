<template>
  <v-container fluid class="pa-0 ma-0" style="overflow-y: scroll !important;">
    <item-list categoryName="Searched" :lists="searched" ref="searched" />
  </v-container>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import ItemList from "@/views/ItemList.vue";
  import { Vue, Component } from "vue-property-decorator";

  @Component({
    components: {
      itemList: ItemList,
    },
  })
  export default class HomeTab extends Vue {
    get searched() {
      return this.$store.state.userData.searchedItems;
    }
  }
</script>
