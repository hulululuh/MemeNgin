<template>
  <v-dialog v-model="dialog" fullscreen transition="dialog-bottom-transition">
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        color="primary"
        dark
        v-bind="attrs"
        v-on="on"
        class="system-bar-button"
      >
        <v-icon>mdi-menu</v-icon>
      </v-btn>
    </template>

    <v-card>
      <v-btn color="primary" dark @click="dialog = false">
        <v-icon>mdi-menu</v-icon>
      </v-btn>
      <v-tabs Left>
        <v-tab>Home</v-tab>
        <v-tab>Explore</v-tab>
        <v-tab>Workshop</v-tab>
        <v-tab-item justify="center" v-for="n in 3" :key="n">
          <v-container fluid style="overflow-y: scroll !important;">
            <v-row class="grid">
              <v-col v-for="i in 30" :key="i" cols="auto" md="auto">
                <project-item />
              </v-col>
            </v-row>
          </v-container>
        </v-tab-item>
      </v-tabs>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Vue, Component } from "vue-property-decorator";
  import ProjectItem from "@/views/ProjectItem.vue";

  @Component({
    components: {
      projectItem: ProjectItem,
    },
  })
  export default class StartupMenu extends Vue {
    dialog: boolean = false;
    notifications: boolean = false;
    sound: boolean = true;
    widgets: boolean = false;
  }
</script>
