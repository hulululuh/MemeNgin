<template>
  <v-container class="field ma-0 pa-0">
    <v-subheader class="ma-0 pa-0">
      <property-name
        ref="propertyName"
        @onApply="onApply"
        @onCancel="onCancel"
      />
    </v-subheader>
    <v-container>
      <v-row no-gutters>
        <v-col class="ma-0 pa-0 width=10%" md="2">
          Pos
        </v-col>
        <v-checkbox
          v-model="prop.positionExposed"
          @change="updateExposedPos"
          class="ma-0 pa-0"
          type="number"
          hide-details
        />
        <v-subheader> x:</v-subheader>
        <v-col class="ma-0 pa-0" md="4.5">
          <v-text-field
            class=" ma-0 pa-0"
            step="0.001"
            reverse
            :value="parseFloat(prop.value.position[0]).toFixed(3)"
            @input="onInputPosX"
            @blur="blur"
            @change="blur"
            @focus="focus"
            hide-details
          />
        </v-col>
        <v-subheader> y:</v-subheader>
        <v-col class="ma-0 pa-0" md="4.5">
          <v-text-field
            class="ma-0 pa-0"
            step="0.001"
            reverse
            :value="parseFloat(prop.value.position[1]).toFixed(3)"
            @input="onInputPosY"
            @blur="blur"
            @change="blur"
            hide-details
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col class="ma-0 pa-0 width=10%" md="2">
          Scale
        </v-col>
        <v-checkbox
          v-model="prop.scaleExposed"
          @change="updateExposedScale"
          class="ma-0 pa-0"
          type="number"
          hide-details
        />
        <v-subheader> x:</v-subheader>
        <v-col class="ma-0 pa-0" md="4.5">
          <v-text-field
            class="text-aligned-right ma-0 pa-0"
            step="0.001"
            reverse
            :value="parseFloat(prop.value.scale[0]).toFixed(3)"
            @input="onInputScaleX"
            @blur="blur"
            @change="blur"
            hide-details
          />
        </v-col>
        <v-subheader> y:</v-subheader>
        <v-col class="ma-0 pa-0" md="4.5">
          <v-text-field
            class="text-aligned-right ma-0 pa-0"
            step="0.001"
            reverse
            :value="parseFloat(prop.value.scale[1]).toFixed(3)"
            @input="onInputScaleY"
            @blur="blur"
            @change="blur"
            hide-details
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col class="ma-0 pa-0 width=10%" md="2">
          Rot
        </v-col>
        <v-checkbox
          v-model="prop.rotationExposed"
          @change="updateExposedRot"
          class="ma-0 pa-0"
          type="number"
          hide-details
        />
        <v-col class="ma-0 pa-0" md="5.5">
          <v-text-field
            class="text-aligned-right ma-0 pa-0"
            step="0.1"
            reverse
            :value="parseFloat(prop.value.rotation).toFixed(1)"
            @input="onInputRotation"
            @blur="blur"
            @change="blur"
            hide-details
          />
        </v-col>
        <v-col class="ma-0 pa-0 width=10%" md="3.5"> </v-col>
      </v-row>
    </v-container>
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
    Transform2DProperty,
  } from "@/lib/designer/properties";
  import { PropertyChangeComplete } from "./ipropertyui";
  import { UndoStack } from "@/lib/undostack";
  import { PropertyChangeAction } from "@/lib/actions/propertychangeaction";
  import { Transform2D } from "@/lib/math/transform2d";
  import { Vector2 } from "@math.gl/core";
  import PropertyName from "@/components/properties/PropertyName.vue";

  export enum Transform2DComponent {
    PositionX,
    PositionY,
    ScaleX,
    ScaleY,
    Rotation,
    None,
  }

  @Component({
    components: {
      propertyName: PropertyName,
    },
  })
  export default class Transform2DPropertyView extends Vue {
    positionX: number;
    positionY: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    dirtyComponent: Transform2DComponent; // this flag set to true when the input form is edited

    @Prop()
    // FloatProperty
    prop: Transform2DProperty;

    @Prop()
    designer: Designer;

    @Prop()
    propHolder: IPropertyHolder;

    oldValue: any;

    calcTransform() {
      return new Transform2D(
        new Vector2(this.positionX, this.positionY),
        new Vector2(this.scaleX, this.scaleY),
        this.rotation
      );
    }

    mounted() {
      const transform = this.prop.value;
      this.positionX = transform.position[0];
      this.positionY = transform.position[1];
      this.scaleX = transform.scale[0];
      this.scaleY = transform.scale[1];
      this.rotation = transform.rotation;
      this.dirtyComponent = Transform2DComponent.None;
      this.propertyName.name = this.prop.displayName;
    }

    get propertyName() {
      return this.$refs.propertyName as PropertyName;
    }

    onApply() {
      this.prop.displayName = this.propertyName.name;
    }

    onCancel() {
      this.propertyName.name = this.prop.displayName;
    }

    focus() {
      this.oldValue = { value: this.calcTransform(), exposed: false };
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

    updateExposedPos(value) {
      let prop = this.prop.pProp;
      this.propHolder.setProperty(prop.name, {
        value: prop.getValue(),
        exposed: value,
      });
      this.$emit("propertyExposeChanged", prop);
    }

    updateExposedScale(value) {
      let prop = this.prop.sProp;
      this.propHolder.setProperty(prop.name, {
        value: prop.getValue(),
        exposed: value,
      });
      this.$emit("propertyExposeChanged", prop);
    }

    updateExposedRot(value) {
      let prop = this.prop.rProp;
      this.propHolder.setProperty(prop.name, {
        value: prop.getValue(),
        exposed: value,
      });
      this.$emit("propertyExposeChanged", prop);
    }

    onInputPosX(value) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        this.positionX = parsed;
        this.dirtyComponent = Transform2DComponent.PositionX;
      }
    }

    onInputPosY(value) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        this.positionY = parsed;
        this.dirtyComponent = Transform2DComponent.PositionY;
      }
    }

    onInputScaleX(value) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        this.scaleX = parsed;
        this.dirtyComponent = Transform2DComponent.ScaleX;
      }
    }

    onInputScaleY(value) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        this.scaleY = parsed;
        this.dirtyComponent = Transform2DComponent.ScaleY;
      }
    }

    onInputRotation(value) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        this.rotation = parsed;
        this.dirtyComponent = Transform2DComponent.Rotation;
      }
    }

    blur(evt) {
      let xf = this.prop.getValue().clone();

      // if input form has changed
      if (this.dirtyComponent != Transform2DComponent.None) {
        this.oldValue = { value: xf, exposed: false };

        if (this.dirtyComponent != Transform2DComponent.PositionX)
          this.positionX = xf.position[0];
        if (this.dirtyComponent != Transform2DComponent.PositionY)
          this.positionY = xf.position[1];
        if (this.dirtyComponent != Transform2DComponent.ScaleX)
          this.scaleX = xf.scale[0];
        if (this.dirtyComponent != Transform2DComponent.ScaleY)
          this.scaleY = xf.scale[1];
        if (this.dirtyComponent != Transform2DComponent.Rotation)
          this.rotation = xf.rotation;

        xf = this.calcTransform();
      } else {
        this.oldValue = { value: xf, exposed: false };
      }

      if (!xf.equals(this.prop.getValue())) {
        this.propHolder.setProperty(this.prop.name, {
          value: xf,
          exposed: false,
        });
        this.propertyChanged();

        // todo: make it happen!
        let action = new PropertyChangeAction(
          null,
          this.prop.name,
          this.propHolder,
          this.oldValue,
          { value: xf, exposed: false }
        );
        UndoStack.current.push(action);
      }

      this.dirtyComponent = Transform2DComponent.None;
    }
  }
</script>

<style scoped>
  .field {
    font-size: 12px;
    padding: 0.9em 0.5em;
    /* color: rgba(255, 255, 255, 0.7); */
    border-bottom: 1px rgb(61, 61, 61) solid;
  }

  .field label {
    font-weight: bold;
    padding: 0.4em;
    padding-left: 0;
  }

  .number {
    border: solid transparent 1px;
    border-radius: 4px;
    position: relative;
    outline: none;
    display: flex;
    align-content: right;

    background: #4e4e4e;
    color: rgba(255, 255, 255, 0.8);

    width: calc(100% - 1em - 1px);
    box-sizing: border-box;
    text-align: right;
    padding: 0.5em;
    padding-right: 1.5em;
  }

  .number:focus {
    border-color: dodgerblue;
  }

  .number::-webkit-inner-spin-button {
    width: 1em;
    border-left: 1px solid #bbb;
    opacity: 1;
    color: rgb(130, 130, 130);
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    cursor: pointer;
  }

  .input-holder {
    display: flex;
    width: 100%;
    margin-right: 3px;
    padding: 0.4em;
  }

  label {
    /* Other styling... */
    text-align: right;
    clear: both;
    float: left;
    /* margin-right:15px; */
    display: flex;
  }

  table#transform {
    border: 0;
    border-spacing: 0;
    padding: 0;
    font-size: 12px;
    font-weight: bold;
    resize: both;
    table-layout: auto;
    width: 100%;
  }
</style>
