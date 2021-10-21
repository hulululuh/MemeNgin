// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

// https://thebookofshaders.com/11/
export class SimplexNoiseNode extends ImageDesignerNode {
  init() {
    this.title = "Simplex Noise";

    this.addIntProperty("scale", "Scale", 100, 1, 1024, 1);
    this.addIntProperty("scaleX", "Scale X", 1, 1, 5, 1);
    this.addIntProperty("scaleY", "Scale Y", 1, 1, 5, 1);
    this.addIntProperty("seed", "Seed", 32, 0, 1024, 1);

    let source = `
        float wrapAround(float value, float upperBound) {
            return mod((value + upperBound - 1.0), upperBound);
        }

        float wrapAndHash(vec2 value, vec2 upperBounds) {
            value.x = wrapAround(value.x, upperBounds.x);
            value.y = wrapAround(value.y, upperBounds.y);

            return hash12(value + vec2(prop_seed));
        }

        float noise( in vec2 p )
        {
            vec2 i = floor( p );
            vec2 f = fract( p );
            
            vec2 u = f*f*(3.0-2.0*f);

            vec2 bounds = vec2(float(prop_scaleX), float(prop_scaleY))  * float(prop_scale);

            return mix( mix( wrapAndHash( i + vec2(0.0,0.0), bounds), 
                            wrapAndHash( i + vec2(1.0,0.0), bounds), u.x),
                        mix( wrapAndHash( i + vec2(0.0,1.0), bounds), 
                            wrapAndHash( i + vec2(1.0,1.0), bounds), u.x), u.y);
        }

        vec4 process(vec2 uv)
        {
            vec3 color = vec3(noise(uv * vec2(float(prop_scaleX), float(prop_scaleY)) * float(prop_scale)));

            return vec4(color,1.0);
        }
        `;

    this.buildShader(source);
  }
}
