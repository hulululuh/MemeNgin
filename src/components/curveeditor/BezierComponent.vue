<script lang="ts">
  import { Vue, Component } from "vue-property-decorator";

  @Component
  export default class BezierComponent extends Vue {
    xFrom: number = 0;
    yFrom: number = 0;
    xTo: number = 1;
    yTo: number = 1;
    value: number = 0;
  }
</script>
