import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class DirectionalWarpNode extends ImageDesignerNode {
  init() {
    this.title = "Directional Warp";

    this.addInput("image");
    this.addInput("heightMap");

    this.addFloatProperty("intensity", "Intensity", 0.1, -0.5, 0.5, 0.01);
    this.addFloatProperty("angle", "Angle", 0.85, -3.142, 3.142, 0.01);

    // calculates normal, then warps uv by it
    let source = `
        vec4 process(vec2 uv)
        {
            vec2 step = vec2(1.0,1.0)/_textureSize;

            vec2 dir = normalize(vec2(cos(prop_angle), sin(prop_angle)));

            // center point
            float dist = abs(texture(heightMap, uv).r) - 0.5;
            
            vec4 color = texture(image, uv + dir * prop_intensity * dist);

            return color;
        }
        `;

    this.buildShader(source);
  }
}
