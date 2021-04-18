<template>
  <v-card width="192px">
    <v-img
      class="white--text align-center"
      height="192px"
      src="https://cdn.vuetifyjs.com/images/cards/docks.jpg"
    >
      <v-card-title class="justify-center"> {{ this.fileName }} </v-card-title>
    </v-img>

    <v-card-text class="text--primary">
      <div>Whitsunday Island</div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Prop, Component } from "vue-property-decorator";
  import path from "path";

  @Component
  export default class ProjectItem extends Vue {
    @Prop() path!: string;

    get fileName() {
      return path.parse(this.path).name;
    }
  }
</script>
