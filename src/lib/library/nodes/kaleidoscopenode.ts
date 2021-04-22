import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class KaleidoscopeNode extends ImageDesignerNode {
  init() {
    this.title = "Kaleidoscope";

    this.addInput("image");

    this.addFloatProperty("rotation", "Rotation", 2.5, 0.0, 10.0, 0.01);
    this.addFloatProperty("zoom", "Zoom", 2.5, 0.0, 10.0, 0.01);

    let source = `
        vec2 kaleido(vec2 uv)
        {
            float th = atan(uv.y, uv.x);
            float r = pow(length(uv), .9);
            float f = 3.14159 / 3.5;

            th = abs(mod(th + f/4.0, f) - f/2.0) / (1.0 + r);

            return vec2(cos(th), sin(th)) * r * .1;
        }

        vec2 transform(vec2 at)
        {
            vec2 v;
            float th = .02 * 1.0;
            v.x = at.x * cos(th) - at.y * sin(th) - .2 * sin(th);
            v.y = at.x * sin(th) + at.y * cos(th) + .2 * cos(th);
            return v;
        }

        vec4 scene(vec2 at)
        {
            float x = mod(3.0 / 8.0, 3.0);
            vec4 col = vec4(0.0, 0.0, 0.0, 1.0);
            if (image_connected) {
                col = texture(image, transform(at) * prop_rotation);
            } 
            return col;
        }

        vec4 process(vec2 uv)
        {
            vec2 kuv = (uv-vec2(0.5))*prop_zoom;
            float ratio = image_size.y/image_size.x;
            kuv.y *= ratio;
            return scene(kaleido(kuv));
        }
        `;

    this.buildShader(source);
  }
}
