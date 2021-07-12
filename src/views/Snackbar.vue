<template>
  <div flex class="text-center">
    <v-btn
      icon
      dark
      max-width="32px"
      height="32px"
      color="primary"
      @click.stop="snackbar = true"
    >
      <v-icon> mdi-help-circle </v-icon>
    </v-btn>
    <v-snackbar class="ma-2" v-model="snackbar">
      {{ text }}

      <template v-slot:action="{ attrs }">
        <v-btn
          class="mr-5"
          color="primary"
          text
          v-bind="attrs"
          @click.stop="snackbar = false"
        >
          {{ textClose }}
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import ItemList from "@/views/ItemList.vue";
  import { Vue, Component, Prop } from "vue-property-decorator";

  @Component({
    components: {
      itemList: ItemList,
    },
  })
  export default class Snackbar extends Vue {
    @Prop() text: string;
    @Prop() textClose: string;
    show: boolean = false;

    get snackbar() {
      return this.show;
    }

    set snackbar(value) {
      this.show = value;
    }
  }
</script>
