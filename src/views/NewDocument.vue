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
        src="assets/icons/plus.svg"
        @click="open"
      >
        <v-card-title class="justify-center" fluid style="font-size:18px">
          {{ title }}
        </v-card-title>
      </v-img>
    </v-card>
  </v-hover>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Component } from "vue-property-decorator";
  import App from "@/App.vue";

  @Component
  export default class newDocument extends Vue {
    open() {
      (this.$root.$children[0] as App).newProject();
    }

    get title() {
      return "New Document";
    }
  }
</script>
