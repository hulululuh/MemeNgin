<template>
  <v-container class="field ma-0 pa-0" v-click-outside="blur">
    <v-subheader class="ma-0 pa-0">
      <property-name
        ref="propertyName"
        @onApply="onApply"
        @onCancel="onCancel"
      />
    </v-subheader>
    <v-input
      class="ma-0 pa-0"
      hide-details
      style="min-height:50px;"
      ref="inputHolder"
    >
      <template v-slot:prepend>
        <v-checkbox
          disabled
          v-model="prop.exposed"
          @change="updateExposed"
          class="ma-0 pa-0"
          hide-details
        >
        </v-checkbox>
      </template>
      <canvas ref="canvas" />
    </v-input>
    <v-color-picker block v-if="isOpen" @input="onColorPicked" :value="color" />
  </v-container>
</template>

<style scoped lang="scss">
  @import "../../../public/scss/property.scss";
</style>

<script lang="ts">
  import { Vue, Prop, Component, Emit, Watch } from "vue-property-decorator";
  import { Designer } from "@/lib/designer";
  import { Gradient, GradientPoint } from "@/lib/designer/gradient";
  import { Color } from "@/lib/designer/color";
  import { IPropertyHolder } from "@/lib/designer/properties";
  import { PropertyChangeAction } from "@/lib/actions/propertychangeaction";
  import { UndoStack } from "@/lib/undostack";
  import PropertyName from "@/components/properties/PropertyName.vue";

  @Component({
    components: {
      propertyName: PropertyName,
    },
  })
  export default class GradientPropertyView extends Vue {
    @Prop()
    // FloatProperty
    prop: any;

    widget: GradientWidget;

    open: boolean = false;

    @Prop()
    designer: Designer;

    @Prop()
    propHolder: IPropertyHolder;

    oldValue: any;

    color: Color;

    mounted() {
      this.widget = new GradientWidget({
        width: 272,
        //width: (this.$refs.inputHolder as HTMLDivElement).offsetWidth - 150,
        canvas: this.$refs.canvas,
        holder: this,
      });

      this.oldValue = {
        value: this.prop.getValue().clone(),
        exposed: this.prop.getExposed(),
      };
      this.widget.setGradient(this.prop.value.clone());
      this.widget.onvaluechanged = this.updateChanged;
      this.widget.oninput = this.updateInput;
      this.propertyName.name = this.prop.displayName;

      // let erd = new elementResizeDetectorMaker();
      // erd.listenTo(this.$refs.inputHolder, (element) => {
      //   let width = element.offsetWidth;
      //   let height = element.offsetHeight;

      //   this.widget.resize(width, height);
      // });
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

    get isOpen() {
      return this.open;
    }

    beforeDestroy() {
      this.widget.dispose();
    }

    @Emit()
    propertyExposeChanged() {
      this.$emit("propertyExposeChanged", this.prop);
      return this.prop.name;
    }

    updateExposed(value) {
      this.propHolder.setProperty(this.prop.name, {
        value: this.prop.getValue(),
        exposed: value,
      });
      this.propertyExposeChanged();
    }

    @Emit()
    propertyChanged() {
      return this.prop.name;
    }

    updateInput(gradient: Gradient) {
      const value = { value: gradient.clone(), exposed: false };
      this.propHolder.setProperty(this.prop.name, value);
      this.propertyChanged();
      //this.propHolder.setProperty(this.prop.name, gradient.clone());
    }

    updateChanged(gradient: Gradient) {
      let newValue = { value: gradient.clone(), exposed: false };
      this.propHolder.setProperty(this.prop.name, newValue);

      let action = new PropertyChangeAction(
        // todo: this is a bad fix, correct fix below
        () => {
          this.widget.setGradient(this.prop.getValue());
        },
        this.prop.name,
        this.propHolder,
        this.oldValue,
        newValue
      );
      UndoStack.current.push(action);

      this.oldValue = { value: newValue.value.clone(), exposed: false };
    }

    blur() {
      if (this.open) {
        this.open = false;
      }

      this.updateChanged(this.widget.gradient);
      this.widget.redrawCanvas();
    }

    onColorPicked(value) {
      this.color = value;

      const handle = this.widget.focusedHandle;
      if (handle) {
        handle.gradientPoint.color = new Color(
          value.r / 255,
          value.g / 255,
          value.b / 255,
          value.a
        );
        this.widget.redrawCanvas();

        this.updateInput(this.widget.gradient);
      }
    }

    @Watch("prop", { deep: true })
    gradChanged(oldVal, newVal) {
      //console.log("grad changed");
      // if new val is different from widget val
      // then set gradient
      // otherwise do nothing
      // todo: this is the proper fix
    }
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  export class Point {
    constructor(public x: number, public y: number) {}
  }

  export class Box {
    x: number = 0;
    y: number = 0;
    width: number = 1;
    height: number = 1;

    isPointInside(px: number, py: number): boolean {
      if (
        px >= this.x &&
        px <= this.x + this.width &&
        py >= this.y &&
        py <= this.y + this.height
      )
        return true;
      return false;
    }

    setCenter(x: number, y: number) {
      this.x = x - this.width / 2;
      this.y = y - this.height / 2;
    }

    setCenterX(x: number) {
      this.x = x - this.width / 2;
    }

    setCenterY(y: number) {
      this.y = y - this.height / 2;
    }

    centerX(): number {
      return this.x + this.width / 2;
    }

    centerY(): number {
      return this.y + this.height / 2;
    }

    move(dx: number, dy: number) {
      this.x += dx;
      this.y += dy;
    }
  }

  class GradientHandle {
    xbox: Box;
    colorBox: Box = new Box();

    gradientPoint: GradientPoint;
  }

  export class GradientWidget {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    gradient: Gradient;

    width: number;
    height: number;
    holder: any;

    handles: GradientHandle[];
    lastMouseDown: Point;
    hitHandle: GradientHandle;
    focusedHandle: GradientHandle;
    // if the hitHandle is just created then this is true
    // it prevents the color picking showingup on mouse release
    // for new handles
    isNewHandle: boolean;

    handleSize: number;

    onvaluechanged: (gradient: Gradient) => void;
    oninput: (gradient: Gradient) => void;

    constructor(options: any) {
      this.width = options.width || 300;
      this.height = options.height || 50;
      this.handleSize = options.handleSize || 16;
      this.holder = options.holder || null;

      this.canvas = options.canvas || document.createElement("canvas");
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.ctx = this.canvas.getContext("2d");

      this.handles = Array();
      this.lastMouseDown = new Point(0, 0);
      this.isNewHandle = false;

      //this.gradient = new Gradient();
      this.setGradient(new Gradient());
      this.bindEvents();
      this.redrawCanvas();
    }

    resize(width: number, height: number) {
      this.canvas.width = width;
      this.width = width;

      // recalc positions of all handles
      for (let handle of this.handles) {
        handle.colorBox.setCenterX(width * handle.gradientPoint.t);
      }

      this.redrawCanvas();
    }

    bindEvents() {
      let self = this;
      this.canvas.onmousedown = (evt) => this.onMouseDown(evt);

      //this.canvas.onmouseup = evt => this.onMouseUp(evt);
      document.documentElement.addEventListener("mouseup", (evt) =>
        self.onMouseUp(evt)
      );

      //this.canvas.onmousemove = this.onMouseMove;
      document.documentElement.addEventListener("mousemove", (evt) =>
        self.onMouseMove(evt)
      );

      this.canvas.oncontextmenu = function(evt: PointerEvent) {
        evt.preventDefault();
      };

      /*
        this.canvas.onmouseleave = function(evt:MouseEvent)
        {
            // cancel dragging
            self.hitHandle = null;
            self.redrawCanvas();
        }
        */
    }

    onMouseDown(evt: MouseEvent) {
      let self = this;

      self.lastMouseDown = getMousePos(self.canvas, evt);
      self.hitHandle = self.getHitHandle(self.lastMouseDown);
      self.focusedHandle = self.hitHandle;
      self.isNewHandle = false;

      // if no box is hit then add one and make it the drag target
      if (self.hitHandle == null && evt.button == 0) {
        let t = self.lastMouseDown.x / self.width;
        let col = self.gradient.sample(t);
        let p = self.gradient.addPoint(t, col);

        let handle = self.createGradientHandleFromPoint(p);

        self.handles.push(handle);

        // make handle draggable
        self.hitHandle = handle;
        self.isNewHandle = true;

        if (self.oninput) self.oninput(self.gradient);
        //if (self.onvaluechanged) self.onvaluechanged(self.gradient);
      } else if (self.hitHandle && evt.button == 2) {
        // delete handle
        self.removeHandle(self.hitHandle);
        self.hitHandle = null;

        if (self.oninput) self.oninput(self.gradient);
        //if (self.onvaluechanged) self.onvaluechanged(self.gradient);
      }

      self.redrawCanvas();
    }

    onMouseUp(evt: MouseEvent) {
      let self = this;

      let hitPos = getMousePos(self.canvas, evt);
      if (
        self.lastMouseDown.x == hitPos.x &&
        self.lastMouseDown.y == hitPos.y &&
        self.hitHandle &&
        !self.isNewHandle
      ) {
        let hitHandle = self.hitHandle;
        self.hitHandle = null;

        if (this.holder) {
          this.holder.color = self.focusedHandle.gradientPoint.colorForPicker;
          this.holder.open = true;
          return;
        }

        // // show color picker
        // let input = document.createElement("input");
        // input.type = "color";
        // input.value = hitHandle.gradientPoint.color.toHex();
        // input.onchange = function(ev: Event) {
        //   console.log("onchange");
        //   console.log(ev);
        //   console.log(hitHandle);
        //   hitHandle.gradientPoint.color = Color.parse(input.value);
        //   self.redrawCanvas();
        //   //self.hitHandle = null;

        //   if (self.onvaluechanged) self.onvaluechanged(self.gradient);
        // };

        // input.oninput = (ev: Event) => {
        //   console.log(evt);
        //   console.log("oninput");

        //   hitHandle.gradientPoint.color = Color.parse(input.value);
        //   self.redrawCanvas();
        //   //self.hitHandle = null;

        //   if (self.oninput) self.oninput(self.gradient);
        // };
        // input.click();

        //input.onchange = null; // cleanup
        //self.hitHandle = null;
      } else if (self.hitHandle) {
        if (self.onvaluechanged) self.onvaluechanged(self.gradient);
        self.hitHandle = null;
      } else {
        self.hitHandle = null;
        self.redrawCanvas();
      }
    }

    onMouseMove(evt: MouseEvent) {
      let self = this;
      //let hitPos = getMousePos(self.canvas, evt);
      //console.log(self);
      let hitPos = getMousePos(self.canvas, evt);
      if (self.hitHandle) {
        // cap hit pos
        let x = clamp(hitPos.x, 0, self.width);
        self.hitHandle.colorBox.setCenterX(x);

        // recalc gradient t
        let t = x / self.width;
        self.hitHandle.gradientPoint.t = t;

        // resort handles
        self.gradient.sort();

        //if (self.onvaluechanged) self.onvaluechanged(self.gradient);
        if (self.oninput) self.oninput(self.gradient);
      }

      self.redrawCanvas();
    }

    removeHandle(handle: GradientHandle) {
      this.gradient.removePoint(handle.gradientPoint);
      this.handles.splice(this.handles.indexOf(handle), 1);
    }

    getHitHandle(pos: Point): GradientHandle {
      for (let handle of this.handles) {
        if (handle.colorBox.isPointInside(pos.x, pos.y)) {
          //console.log("handle hit!");
          return handle;
        }
      }

      return null;
    }

    setGradient(grad: Gradient) {
      this.handles = Array();
      let handleSize = this.handleSize;

      for (let p of grad.points) {
        let handle = this.createGradientHandleFromPoint(p);
        this.handles.push(handle);
      }

      this.gradient = grad;

      this.redrawCanvas();
    }

    createGradientHandleFromPoint(p: GradientPoint): GradientHandle {
      let handleSize = this.handleSize;

      let handle = new GradientHandle();
      handle.gradientPoint = p;
      // eval point locations
      let box = handle.colorBox;
      box.width = handleSize;
      box.height = handleSize;
      let x = p.t * this.width;
      box.setCenterX(x);
      box.y = this.height - handleSize;

      return handle;
    }

    el() {
      return this.canvas;
    }

    redrawCanvas() {
      let ctx = this.ctx;

      ctx.clearRect(0, 0, this.width, this.height);

      let grad = ctx.createLinearGradient(0, 0, this.width, 0);
      for (let point of this.gradient.points) {
        grad.addColorStop(point.t, point.color.toHex());
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height - this.handleSize);

      this.drawHandles();
    }

    drawHandles() {
      let ctx = this.ctx;
      for (let handle of this.handles) {
        let colBox = handle.colorBox;
        // background
        ctx.beginPath();
        ctx.fillStyle = handle.gradientPoint.color.toHex();
        //ctx.rect(colBox.x, colBox.y, colBox.width, colBox.height);
        roundRect(ctx, colBox.x, colBox.y, colBox.width, colBox.height, 1);
        ctx.fill();

        // border
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgb(0, 0, 0)";
        //ctx.rect(colBox.x, colBox.y, colBox.width, colBox.height);
        roundRect(ctx, colBox.x, colBox.y, colBox.width, colBox.height, 1);
        ctx.stroke();

        // triangle at top
        ctx.fillStyle = "rgb(0, 0, 0)";
        ctx.beginPath();
        ctx.moveTo(colBox.centerX(), colBox.y - 5);
        ctx.lineTo(colBox.x, colBox.y);
        ctx.lineTo(colBox.x + colBox.width, colBox.y);
        ctx.fill();
      }
    }

    dispose() {
      // remove all callbacks
    }
  }

  // https://www.html5canvastutorials.com/advanced/html5-canvas-mouse-coordinates/
  // https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
  function getMousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };
  }

  //https://stackoverflow.com/questions/10214873/make-canvas-as-wide-and-as-high-as-parent
  function fitCanvasToContainer(canvas) {
    // Make it visually fill the positioned parent
    canvas.style.width = "100%";
    // 1em is the size of the top bar
    canvas.style.height = "100%";
    // ...then set the internal size to match
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    //canvas.height = canvas.offsetWidth;

    canvas.style.width = "auto";
    canvas.style.height = "auto";
  }

  // https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
  function roundRect(ctx: CanvasRenderingContext2D, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    //ctx.stroke();
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
    width: calc(100% - 4px - 1px);
    border: solid gray 1px;
    padding: 2px;
    border-radius: 2px;
  }

  .input-holder {
    display: flex;
  }

  .texture-options {
    background: #e0e0e0;
    border-radius: 3px;
    margin-bottom: 1em !important;
    padding: 1em;
  }
</style>
