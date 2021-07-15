// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class HexagonNode extends ImageDesignerNode {
  public init() {
    this.title = "Hexagon";

    this.addInput("image");

    this.addIntProperty("scaleX", "X Scale", 2, 1, 32, 1);
    this.addIntProperty("scaleY", "Y Scale", 2, 1, 32, 1);
    this.addFloatProperty("margin", "Margin", 1.0, 0.0, 1.0, 0.01);
    this.addFloatProperty("gradient", "Gradient", 0.1, 0, 1.0, 0.01);
    this.addFloatProperty("zoom", "Zoom", 1.0, 0.25, 2.0, 0.01);

    const source = `
        // https://www.shadertoy.com/view/Xljczw
        
        //todo: cleanup
        const vec2 s = vec2(1, 1.7320508); // sqrt(3.0)
        vec4 getHex(vec2 p){
            vec4 hC = floor(vec4(p, p - vec2(.5, 1))/s.xyxy) + .5;
            vec4 h = vec4(p - hC.xy*s, p - (hC.zw + .5)*s);
            return dot(h.xy, h.xy)<dot(h.zw, h.zw) ? vec4(h.xy, hC.xy) : vec4(h.zw, hC.zw + vec2(.5, 1));
        }

        float hex(in vec2 p){
            p = abs(p);
            return max(dot(p, s*.5), p.x);
        }

        float linearstep(float a, float b, float t)
        {
            if (t <= a) return 0.0;
            if (t >= b) return 1.0;

            return (t-a)/(b-a);
        }

        //const float ratio = 1.15470053838;// 2/sqrt(3)

        // https://www.redblobgames.com/grids/hexagons/
        //const float ratio =3.0 * (1.0/sqrt(3.0));
        const float ratio = 1.0;
        vec4 process(vec2 uv)
        {
            // it
            vec4 h = getHex(uv*vec2(float(prop_scaleX), float(prop_scaleY) * ratio));
            float dist = hex(h.xy) * 2.0;// result range from hex function is 0.0-0.5
            float finalDist = 1.0 - linearstep(prop_margin - prop_margin*prop_gradient, prop_margin, dist);
            
            vec2 hexUV = (h.xy) / prop_zoom + vec2(0.5);
            if (image_connected) {
                vec4 colImg = texture(image, hexUV);
                colImg.a *= finalDist;
                return colImg;
            } else {
                vec2 cCoord = (hexUV * 2.0);
                bool checker = UVtoCheck(cCoord);
                const float w = 0.25;
                
                vec3 color = vec3(hexUV, 0.0)*(1.0-w) + (checker ? vec3(1.0) : vec3(0.0, 0.0, 1.0))*w;
                // draw uv coord instead
                return vec4(color, finalDist);
            }
        }
        `;

    this.buildShader(source);
  }
}
