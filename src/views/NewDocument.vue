<template v-on:change="onChanged">
  <v-hover v-slot="{ hover }">
    <v-card
      class="mt-1"
      width="192px"
      height="192px"
      :elevation="hover ? 16 : 2"
      :class="{ 'on-hover': hover }"
    >
      <v-img
        id="thumbnail"
        class="white--text align-center"
        style="text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;"
        height="100%"
        width="100%"
        src="assets/icons/plus-thick.svg"
        @click="open"
      >
        <v-card-title
          class="justify-center align-end"
          flex
          fluid
          style="font-size:17px"
        >
          {{ title }}
        </v-card-title>
      </v-img>
      <project-name-dialog ref="dialog" />
    </v-card>
  </v-hover>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Component } from "vue-property-decorator";
  import ProjectNameDialog from "@/views/ProjectNameDialog.vue";

  @Component({
    components: {
      projectNameDialog: ProjectNameDialog,
    },
  })
  export default class NewDocument extends Vue {
    open() {
      (this.$refs.dialog as ProjectNameDialog).dialog = true;
    }

    get title() {
      return "New Document";
    }
  }
</script>
