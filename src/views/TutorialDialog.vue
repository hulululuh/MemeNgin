<template>
  <v-dialog
    v-model="dialog"
    max-width="960px"
    persistent
    @keydown.esc="dialog = false"
  >
    <v-card class="rounded-0" elevation="0" color="grey">
      <v-card-actions>
        <v-spacer />
        <v-btn class="mr-1" depressed x-small fab dark @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-actions>
      <v-carousel class="tutorial-carousel" v-model="model">
        <v-carousel-item v-for="(item, i) in items" :key="i">
          <v-sheet :color="item.color" height="100%" tile>
            <v-row
              class="tutorial-text fill-height ml-3 mr-3"
              align="center"
              justify="center"
            >
              <v-col cols="7">
                <v-img :src="item.image" />
              </v-col>
              <v-spacer />
              <v-col cols="5">
                {{ item.text }}
              </v-col>
            </v-row>
          </v-sheet>
        </v-carousel-item>
      </v-carousel>
    </v-card>
    <v-list :color="colorDialog">
      <v-list-item>
        <v-checkbox
          v-model="dontShowIntroAgain"
          class="ma-0 pa-0"
          style="font-weight: bold;"
          :label="textDontShowIntroAgain"
        />
      </v-list-item>
    </v-list>
  </v-dialog>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";

  .tutorial-carousel {
    background: #bbbbbbff;
  }

  .tutorial-text {
    color: black !important;
    font-size: 20px;
    font-weight: 600;
  }
</style>

<script lang="ts">
  import { Vue, Component } from "vue-property-decorator";
  import { TextManager } from "@/assets/textmanager";
  import { UserData } from "@/userdata";

  class TutorialItems {
    image: any;
    color: string;
    text: string;
  }
  @Component
  export default class TutorialDialog extends Vue {
    dialog: boolean = false;
    model: number = 0;
    items: TutorialItems[] = [
      {
        image: "assets/tutorials/intro.png",
        color: "#f1f1f1",
        text: this.textIntro,
      },
      {
        image: "assets/tutorials/nodes.png",
        color: "#f1f1f1",
        text: this.textNodes,
      },
      {
        image: "assets/tutorials/inputs.png",
        color: "#f1f1f1",
        text: this.textInputs,
      },
      {
        image: "assets/tutorials/output.png",
        color: "#f1f1f1",
        text: this.textOutput,
      },
      {
        image: "assets/tutorials/workshop.png",
        color: "#f1f1f1",
        text: this.textWorkshop,
      },
      {
        image: "assets/tutorials/startupmenu.png",
        color: "#f1f1f1",
        text: this.textStartupMenu,
      },
    ];

    get colorDialog() {
      return "#838383";
    }

    get textIntro() {
      return TextManager.translate("${introductions.intro}");
    }

    get textNodes() {
      return TextManager.translate("${introductions.nodes}");
    }

    get textInputs() {
      return TextManager.translate("${introductions.inputs}");
    }

    get textOutput() {
      return TextManager.translate("${introductions.output}");
    }

    get textWorkshop() {
      return TextManager.translate("${introductions.workshop}");
    }

    get textStartupMenu() {
      return TextManager.translate("${introductions.startup_menu}");
    }

    get textDontShowIntroAgain() {
      return TextManager.translate("${introductions.dont_show_again}");
    }

    get dontShowIntroAgain() {
      return UserData.getInstance().dontShowIntroAgain;
    }

    set dontShowIntroAgain(value) {
      UserData.getInstance().dontShowIntroAgain = value;
    }
  }
</script>
