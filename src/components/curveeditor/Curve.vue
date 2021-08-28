<template>
  <v-container
    class="pl-10 pr-10"
    @mousemove="onMouseMove($event)"
    @mouseup="onMouseUp($event)"
  >
    <svg :viewBox="viewBox">
      <path
        class="ma-0 pa-0"
        fill="none"
        stroke="rgba(100, 100, 100, 0.5)"
        :d="gridPath"
        :stroke-width="`${gridWidth}%`"
        :transform="transform"
        ref="canvas"
      />

      <path
        fill="none"
        stroke="black"
        :d="startHandle"
        :stroke-width="`${curveWidth}%`"
        :transform="transform"
      />

      <path
        fill="none"
        stroke="black"
        :d="endHandle"
        :stroke-width="`${curveWidth}%`"
        :transform="transform"
      />

      <path
        fill="none"
        stroke="black"
        :d="curve"
        :stroke-width="`${curveWidth}%`"
        :transform="transform"
      />

      <circle
        stroke="black"
        :fill="fillColor"
        :cx="`${cpStartCalc[0]}`"
        :cy="`${cpStartCalc[1]}`"
        r="0.03"
        :stroke-width="`${curveWidth}%`"
        :transform="transform"
        @mousedown="onMouseDown($event, 0)"
      />

      <circle
        stroke="black"
        :fill="fillColor"
        :cx="`${cpEndCalc[0]}`"
        :cy="`${cpEndCalc[1]}`"
        r="0.03"
        :stroke-width="`${curveWidth}%`"
        :transform="transform"
        @mousedown="onMouseDown($event, 1)"
      />
    </svg>
  </v-container>
</template>

<style scoped lang="scss">
  @import "../../../public/scss/property.scss";
</style>

<script lang="ts">
  import { Vector2 } from "@math.gl/core";
  import { Component, Prop, Emit } from "vue-property-decorator";
  import BezierComponent from "./BezierComponent.vue";

  enum Action {
    None,
    Dragging,
  }

  export enum Handle {
    None,
    Start,
    End,
  }

  @Component
  export default class Curve extends BezierComponent {
    curveColor: string = "#000";
    fillColor: string = "#0095ffff";
    curveWidth: number = 1.5;
    gridWidth: number = 1;
    selectedHandle: Handle = Handle.None;

    ptDragStart: Vector2 = new Vector2(0, 0);
    ptCurrent: Vector2 = new Vector2(0, 0);

    action: Action = Action.None;

    created() {
      let self = this;
      document.documentElement.addEventListener("mouseup", (evt) =>
        self.onMouseUp(evt)
      );
    }

    get ptOffset() {
      return new Vector2(
        this.ptCurrent[0] - this.ptDragStart[0],
        this.ptCurrent[1] - this.ptDragStart[1]
      );
    }

    @Prop()
    readonly margin!: number;
    @Prop({ type: Array, required: true })
    readonly cpStart!: Array<number>;
    @Prop({ type: Array, required: true })
    readonly cpEnd!: Array<number>;

    get cpStartCalc() {
      if (
        this.action == Action.Dragging &&
        this.selectedHandle == Handle.Start
      ) {
        return new Vector2(
          this.cpStart[0] + this.ptOffset[0],
          this.cpStart[1] + this.ptOffset[1]
        );
      } else {
        return this.cpStart;
      }
    }

    get cpEndCalc() {
      if (this.action == Action.Dragging && this.selectedHandle == Handle.End) {
        return new Vector2(
          this.cpEnd[0] + this.ptOffset[0],
          this.cpEnd[1] + this.ptOffset[1]
        );
      } else {
        return this.cpEnd;
      }
    }

    get coordMin() {
      return 0 - this.margin;
    }

    get coordMax() {
      return 1 + this.margin;
    }

    get coordWidth() {
      return this.coordMax - this.coordMin;
    }

    get coordScale() {
      return 1 / (1 + this.margin * 2);
    }

    get viewBox() {
      return `${this.coordMin} ${this.coordMin} ${this.coordMax} ${this.coordMax}`;
    }

    get transform() {
      return `translate(0, ${this.coordScale}) scale(${this.coordScale},${-this
        .coordScale})`;
    }

    get clientRect() {
      return (this.$refs.canvas as HTMLElement).getClientRects()[0];
    }

    get curve() {
      const curve = `M${this.xFrom},${this.yFrom} C${this.cpStartCalc[0]},${this.cpStartCalc[1]} ${this.cpEndCalc[0]},${this.cpEndCalc[1]} ${this.xTo},${this.yTo}`;
      return curve;
    }

    get startHandle() {
      const curve = `m${this.xFrom},${this.yFrom} L${this.cpStartCalc[0]},${this.cpStartCalc[1]}`;
      return curve;
    }

    get endHandle() {
      const curve = `m${this.cpEndCalc[0]},${this.cpEndCalc[1]} L${this.xTo},${this.yTo}`;
      return curve;
    }

    get grid() {
      const path = `m${this.coordMin},${0} L${this.coordMax},${0}
                    m${0},${this.coordMin} L${0},${this.coordMax}`;
      return path;
    }

    get gridPath() {
      const cols = 4;
      const rows = 4;
      const width = this.coordWidth;
      const height = this.coordWidth;
      const initPosition = true;

      // Line distances.
      const sx = 1 / cols;
      const sy = 1 / rows;

      // Horizontal and vertical path segments, joined by relative move commands.
      const px = Array(rows + 1)
        .fill(`h${width}`)
        .join(`m${-width},${sy}`);
      const py = Array(cols + 1)
        .fill(`v${height}`)
        .join(`m${sx},${-height}`);

      // Paths require an initial move command. It can be set either by this function
      // or appended to the returned path.
      return `M${this.coordMin},${0}${px} M${0},${this.coordMin}${py}`;
    }

    getCoordinate(screenX, screenY) {
      const rect = this.clientRect;
      const offsetX = (screenX - rect.x) / rect.width;
      const offsetY = (screenY - rect.y) / rect.height;
      const scale = 1 + this.margin * 2;
      const pt = new Vector2([offsetX, 1 - offsetY]);

      const posX = this.coordMin + pt[0] * scale;
      const posY = this.coordMin + pt[1] * scale;
      //console.log(`[${posX}, ${posY}]`);
      return new Vector2(posX, posY);
    }

    onMouseDown(event, idx) {
      //console.log(`handle ${idx} clicked`);
      this.selectedHandle =
        idx == 0 ? Handle.Start : idx == 1 ? Handle.End : Handle.None;

      this.ptDragStart = this.getCoordinate(event.clientX, event.clientY);
      this.ptCurrent = this.getCoordinate(event.clientX, event.clientY);
      this.action = Action.Dragging;

      if (this.selectedHandle < 2) {
        this.onDragStarted();
      }
    }

    onMouseUp(evt) {
      if (this.action != Action.None && this.selectedHandle != Handle.None) {
        this.onApply();
        this.selectedHandle = Handle.None;
        this.action = Action.None;
      }
    }

    onMouseMove(event) {
      if (this.action == Action.Dragging) {
        this.ptCurrent = this.getCoordinate(event.clientX, event.clientY);
        this.$forceUpdate();
      }
    }

    @Emit()
    onApply() {
      this.$emit("onApplyCurve");
    }

    @Emit()
    onDragStarted() {
      this.$emit("onDragStarted");
    }
  }
</script>
