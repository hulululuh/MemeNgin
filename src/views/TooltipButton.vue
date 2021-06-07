<template>
  <v-tooltip bottom>
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        :color="color"
        v-bind="attrs"
        v-on="on"
        :disabled="disabled"
        @click="raiseClickEvent()"
      >
        <v-icon v-show="icon" :color="iconcolor"> {{ icon }} </v-icon>
        <v-img v-show="iconPath" :src="iconPath" />
        {{ text }}
      </v-btn>
    </template>
    <span> {{ tooltip }} </span>
  </v-tooltip>
</template>

<style scoped lang="scss">
  @import "../../public/scss/app.scss";
</style>

<script lang="ts">
  import { Component, Vue, Prop } from "vue-property-decorator";
  @Component
  export default class TooltipButton extends Vue {
    @Prop() text: string;
    @Prop() icon: string;
    @Prop() iconPath: string;
    @Prop() color: string;
    @Prop() iconcolor: string;
    @Prop() tooltip: string;
    @Prop() disabled: boolean;

    beforeCreated() {
      this.color = "primary";
      this.iconcolor = "white";
      this.disabled = true;
    }
    raiseClickEvent() {
      this.$emit("click");
    }
  }
</script>
