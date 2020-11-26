<template>
  <div class="field">
    <div>
      <label>{{ prop.displayName }}</label>
    </div>
    <br>

    <div style="width:100%">
      <table id="transform">
        <tr>
            <td>Position</td>
            <td>x:</td>
            <td>
            <input
              id="posX"
              type="number"
              :value="parseFloat(prop.value.position[0]).toFixed(3)"
              :step="0.001"
              @input="updateValuePX"
              @keydown="updateValuePX"
              class="number"
              @focus="focus"
              @blur="blurPX"
              min="-10"
              max="10"
              /></td>
            <td>y:</td>
            <td>
            <input
              id="posY"
              type="number"
              :value="parseFloat(prop.value.position[1]).toFixed(3)"
              :step="0.001"
              @input="updateValuePY"
              @keydown="updateValuePY"
              class="number"
              @focus="focus"
              @blur="blurPY"
              min="-10"
              max="10"
            /></td>
        </tr>
        <tr>
          <td>Scale</td>
          <td>x:</td>
          <td>
            <input
              id="scaleX"
              type="number"
              :value="parseFloat(prop.value.scale[0]).toFixed(3)"
              :step="0.001"
              @input="updateValueSX"
              @keydown="updateValueSX"
              class="number"
              @focus="focus"
              @blur="blurSX"
              min="0.1"
              max="5"
            /></td>
          <td>y:</td>
          <td>
            <input
              id="scaleY"
              type="number"
              :value="parseFloat(prop.value.scale[1]).toFixed(3)"
              :step="0.001"
              @input="updateValueSY"
              @keydown="updateValueSY"
              class="number"
              @focus="focus"
              @blur="blurSY"
              min="0.1"
              max="5"
            /></td>
        </tr>
        <tr>
          <td>Rotation</td>
          <td></td>
          <td>
            <input
              id="rotaiton"
              type="number"
              :value="parseFloat(prop.value.rotation).toFixed(1)"
              :step="0.1"
              @input="updateValueR"
              @keydown="updateValueR"
              class="number"
              @focus="focus"
              @blur="blurR"
              min="0"
              max="360"
            /></td>
          <td></td>
        </tr>
      </table>
    </div>
  </div>
  
</template>

<script lang="ts">
import { Vue, Prop, Component, Emit } from "vue-property-decorator";
import { Designer } from "@/lib/designer";
import { DesignerNode } from "@/lib/designer/designernode";
import { IPropertyHolder } from "../../lib/designer/properties";
import { PropertyChangeComplete } from "./ipropertyui";
import { UndoStack } from "@/lib/undostack";
import { PropertyChangeAction } from "@/lib/actions/propertychangeaction";
import { Transform2D } from '@/lib/math/transform2d';
import { Vector2 } from "@math.gl/core";

export enum Transform2DComponent {
  PositionX,
  PositionY,
  ScaleX,
  ScaleY,
  Rotation
} 

function getUpdatedTransform(xf: Transform2D, val: number, comp: Transform2DComponent) {
  let res = xf.clone();
  if (comp===Transform2DComponent.PositionX) {
    res.position = new Vector2(val, xf.position[1]);
  } else if (comp===Transform2DComponent.PositionY) {
    res.position = new Vector2(xf.position[0], val);
  } else if (comp===Transform2DComponent.ScaleX) {
    res.scale = new Vector2(val, xf.scale[1]);
  } else if (comp===Transform2DComponent.ScaleY) {
    res.scale = new Vector2(xf.scale[0], val);
  } else if (comp===Transform2DComponent.Rotation) {
    res.rotation = val;
  }

  return res;
}

@Component
export default class Transform2DPropertyView extends Vue {
  @Prop()
  // FloatProperty
  prop: any;

  @Prop()
  designer: Designer;

  @Prop()
  propHolder: IPropertyHolder;

  oldValue: Transform2D;

  @Emit()
  propertyChanged() {
    this.$emit("propertyChanged", this.prop);
    return this.prop.name;
  }

  @Emit()
  propertyChangeCompleted(evt: PropertyChangeComplete) {
    return evt;
  }

  updateValue(value: number, comp: Transform2DComponent) {
    const xf = getUpdatedTransform(this.prop.value, value, comp);
    this.propHolder.setProperty(this.prop.name, xf);
    
    this.propertyChanged();
    //this.onValueChanged();
  }

  updateValuePX(evt) {
    const comp = Transform2DComponent.PositionX;
    if (evt.key === "Enter") {
      const val = parseFloat(evt.target.value);
      if (isNaN(val)) return;
      this.updateValue(val, comp);
    } else if(evt.inputType === "historyUndo") {
      const val = parseFloat(evt.detail);
      this.updateValue(val, comp);
    }
  }

  updateValuePY(evt) {
    const comp = Transform2DComponent.PositionY;
    if (evt.key === "Enter") {
      const val = parseFloat(evt.target.value);
      if (isNaN(val)) return;
      this.updateValue(val, comp);
    } else if(evt.inputType === "historyUndo") {
      const val = parseFloat(evt.detail);
      this.updateValue(val, comp);
    }
  }

  updateValueSX(evt) {
    const comp = Transform2DComponent.ScaleX;
    if (evt.key === "Enter") {
      const val = parseFloat(evt.target.value);
      if (isNaN(val)) return;
      this.updateValue(val, comp);
    } else if(evt.inputType === "historyUndo") {
      const val = parseFloat(evt.detail);
      this.updateValue(val, comp);
    }
  }

  updateValueSY(evt) {
    const comp = Transform2DComponent.ScaleY;
    if (evt.key === "Enter") {
      const val = parseFloat(evt.target.value);
      if (isNaN(val)) return;
      this.updateValue(val, comp);
    } else if(evt.inputType === "historyUndo") {
      const val = parseFloat(evt.detail);
      this.updateValue(val, comp);
    }
  }

  updateValueR(evt) {
    const comp = Transform2DComponent.Rotation;
    if (evt.key === "Enter") {
      const val = parseFloat(evt.target.value);
      if (isNaN(val)) return;
      this.updateValue(val, comp);
    } else if(evt.inputType === "historyUndo") {
      const val = parseFloat(evt.detail);
      this.updateValue(val, comp);
    }
  }

  focus(evt) {
    this.oldValue = this.prop.value.clone();
  }

  blurPX(evt) {
    this.updateValue(parseFloat(evt.target.value), Transform2DComponent.PositionX);
  }

  blurPY(evt) {
    this.updateValue(parseFloat(evt.target.value), Transform2DComponent.PositionY);
  }

  blurSX(evt) {
    this.updateValue(parseFloat(evt.target.value), Transform2DComponent.ScaleX);
  }

  blurSY(evt) {
    this.updateValue(parseFloat(evt.target.value), Transform2DComponent.ScaleY);
  }

  blurR(evt) {
    this.updateValue(parseFloat(evt.target.value), Transform2DComponent.Rotation);
  }

  onValueChanged() {
    let action = new PropertyChangeAction(
      null,
      this.prop.name,
      this.propHolder,
      this.oldValue.clone(),
      this.prop.value
    );
    UndoStack.current.push(action);
  }
}
</script>

<style scoped>
.field {
  font-size: 12px;
  padding: 0.9em 0.5em;
  color: rgba(255, 255, 255, 0.7);
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
  width:100%;
  margin-right:3px;
  padding:0.4em;
}

label {
    /* Other styling... */
    text-align: right;
    clear: both;
    float:left;
    /* margin-right:15px; */
    display:flex;
}

table#transform {
  border:0;
  border-spacing:0;
  padding:0;
  font-size: 12px;
  font-weight: bold;
  resize:both;
  table-layout:auto;
  width: 100%;
}

</style>
