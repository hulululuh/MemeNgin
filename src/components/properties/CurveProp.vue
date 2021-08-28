<template>
  <v-container class="field ma-0 pa-0">
    <v-subheader class="ma-0 pa-0">
      <property-name
        ref="propertyName"
        @onApply="onApply"
        @onCancel="onCancel"
      />
    </v-subheader>
    <curve
      :cp-start="cpStart"
      :cp-end="cpEnd"
      :margin="0.1"
      @onApplyCurve="onApplyCurve"
      @onDragStarted="focus"
      ref="curve"
    />

    <v-row class="ma-0 pa-0">
      <v-col class="pa-0 ma-0" v-for="(item, i) in easingFunctions" :key="i"
        ><v-btn
          class="ma-0 pa-0"
          min-width="40px"
          min-height="40px"
          elevation="1"
          @click="selectEasing(i)"
        >
          <v-flex class="ma-1">
            <svg :viewBox="viewBox">
              <path
                fill="none"
                stroke="black"
                :d="curvify(item)"
                :stroke-width="`10%`"
                :transform="transformCurve"
              />
            </svg>
          </v-flex>
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">
  @import "../../../public/scss/property.scss";
</style>

<script lang="ts">
  import { Vue, Prop, Component, Emit } from "vue-property-decorator";
  import { Designer } from "@/lib/designer";
  import {
    IPropertyHolder,
    PROPERTY_NAME_RULES,
    CurveData,
  } from "../../lib/designer/properties";
  import { PropertyChangeComplete } from "./ipropertyui";
  import { UndoStack } from "@/lib/undostack";
  import { PropertyChangeAction } from "@/lib/actions/propertychangeaction";
  import PropertyName from "@/components/properties/PropertyName.vue";
  import Curve, { Handle } from "@/components/curveeditor/Curve.vue";
  import { Vector2 } from "@math.gl/core";
  import { clamp, Easing, EASING_FUNCTIONS } from "@/lib/utils";

  const margin = 0.03;
  @Component({
    components: {
      propertyName: PropertyName,
      curve: Curve,
    },
  })
  export default class CurvePropertyView extends Vue {
    @Prop()
    prop: any;

    @Prop()
    designer: Designer;

    @Prop()
    propHolder: IPropertyHolder;

    oldValue: any;

    text: string;

    isEditing: boolean;

    get easingFunctions(): Map<Easing, number[]> {
      return EASING_FUNCTIONS;
    }

    get propertyName() {
      return this.$refs.propertyName as PropertyName;
    }

    get cpStart() {
      return this.prop.getValue().cpStart;
    }

    get cpEnd() {
      return this.prop.getValue().cpEnd;
    }

    mounted() {
      this.isEditing = false;
      this.text = this.prop.value.toString();
      this.oldValue = {
        value: this.prop.getValue().clone(),
        exposed: this.prop.getExposed(),
      };
      this.propertyName.name = this.prop.displayName;
    }

    onApply() {
      this.prop.displayName = this.propertyName.name;
    }

    onCancel() {
      this.propertyName.name = this.prop.displayName;
    }

    @Emit()
    propertyChanged() {
      this.$emit("propertyChanged", this.prop, this.propHolder);
      return this.prop.name;
    }

    @Emit()
    propertyChangeCompleted(evt: PropertyChangeComplete) {
      return evt;
    }

    @Emit()
    propertyExposeChanged() {
      this.$emit("propertyExposeChanged", this.prop, this.propHolder);
      return this.prop.name;
    }

    get propertyNameRules() {
      return PROPERTY_NAME_RULES;
    }

    updateExposed(value) {
      this.propHolder.setProperty(this.prop.name, {
        value: this.prop.getValue(),
        exposed: value,
      });
      this.propertyExposeChanged();
    }

    updateValue(value) {
      this.text = value.toString();
      this.propHolder.setProperty(this.prop.name, {
        value: value,
        exposed: this.prop.getExposed(),
      });
      this.propertyChanged();
    }

    focus() {
      this.oldValue = {
        value: this.prop.getValue().clone(),
        exposed: this.prop.getExposed(),
      };
    }

    blur() {
      if (
        !this.oldValue.value.equals(this.prop.value) ||
        this.oldValue.exposed != this.prop.exposed
      ) {
        let action = new PropertyChangeAction(
          null,
          this.prop.name,
          this.propHolder,
          this.oldValue,
          { value: this.prop.getValue(), exposed: this.prop.getExposed() }
        );
        UndoStack.current.push(action);
      }
    }

    onApplyCurve() {
      let data = this.prop.getValue();
      let curve = this.$refs.curve as Curve;
      // const ptMin = new Vector2(curve.coordMin, curve.coordMin);
      // const ptMax = new Vector2(curve.coordMax, curve.coordMax);

      const ptMin = new Vector2(Vector2.ZERO);
      const ptMax = new Vector2(1, 1);
      if (curve.selectedHandle == Handle.Start) {
        let cp: Vector2 = new Vector2(curve.cpStart).add(curve.ptOffset);
        data.cpStart = clamp(cp, ptMin, ptMax);
      } else if (curve.selectedHandle == Handle.End) {
        let cp: Vector2 = new Vector2(curve.cpEnd).add(curve.ptOffset);
        data.cpEnd = clamp(cp, ptMin, ptMax);
      }

      this.updateValue(data);
      this.blur();
    }

    selectEasing(func: Easing) {
      this.focus();
      const data = this.easingFunctions.get(func);
      const curveData = new CurveData(
        new Vector2(data[0], data[1]),
        new Vector2(data[2], data[3])
      );
      this.updateValue(curveData);
      this.blur();
    }

    curvify(data: Array<number>) {
      const curveData = data[1];
      const curve = `M0,0 C${curveData[0]},${curveData[1]} ${curveData[2]},${curveData[3]} 1,1`;
      return curve;
    }

    get viewBox() {
      return `${-margin} ${-margin} ${1 + margin} ${1 + margin}`;
    }

    get transformCurve() {
      const coordScale = 1 / (1 + margin * 2);
      return `translate(0, ${coordScale}) scale(${coordScale},${-coordScale})`;
    }
  }
</script>
