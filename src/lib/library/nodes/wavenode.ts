// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class WaveNode extends ImageDesignerNode {
  init() {
    this.title = "Wave";

    this.addIntProperty("xfrequency", "X Frequency", 1, 0, 20, 0.01);
    this.addIntProperty("yfrequency", "Y Frequency", 0, 0, 20, 0.01);
    this.addFloatProperty("phase", "Phase Offset", 0.0, 0.0, 3.142, 0.01);
    this.addFloatProperty("amp", "Amplitude", 0.5, 0.0, 1.0, 0.01);

    // calculates normal, then warps uv by it
    let source = `
        vec4 process(vec2 uv)
        {
            float fx = uv.x * 3.142 * 2.0 * float(prop_xfrequency);
            float fy = uv.y * 3.142 * 2.0 * float(prop_yfrequency);
            float wave = sin(fx + fy + prop_phase) * prop_amp;

            // bring wave to raneg 0...1
            wave = wave * 0.5 + 0.5;

            return vec4(vec3(wave), 1.0);
        }
        `;

    this.buildShader(source);
  }
}
