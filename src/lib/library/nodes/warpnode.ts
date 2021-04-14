import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class WarpNode extends ImageDesignerNode {
  init() {
    this.title = "Warp";
    this.parentIndex = "image";

    this.addInput("image");
    this.addInput("heightMap");

    this.addFloatProperty("intensity", "Intensity", 0.1, -1.0, 1.0, 0.01);

    // calculates normal, then warps uv by it
    let source = `
        vec4 process(vec2 uv)
        {
            vec2 step = vec2(1.0,1.0)/_textureSize;
            vec4 warpCol = texture(heightMap, uv);
            float warp = (warpCol.r + warpCol.g + warpCol.b) / 3.0;

            vec4 color = texture(image, uv + (vec2(warp) - 0.5) * vec2(1.0, -1.0) * prop_intensity);

            return color;
        }
        `;

    this.buildShader(source);
  }
}
