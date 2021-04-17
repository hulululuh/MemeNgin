<template>
  <v-card max-width="256px">
    <v-img
      class="white--text align-center"
      max-height="256px"
      src="https://cdn.vuetifyjs.com/images/cards/docks.jpg"
    >
      <v-card-title class="justify-center"> Dogefornia </v-card-title>
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
  import { Vue, Component } from "vue-property-decorator";

  @Component
  export default class ProjectItem extends Vue {}
</script>
