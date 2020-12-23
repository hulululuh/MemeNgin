import { DesignerNode } from "../../designer/designernode";

// https://github.com/evanw/glfx.js/blob/master/src/filters/adjust/brightnesscontrast.js
export class ColorAdjustNode extends DesignerNode {
  init() {
    this.title = "Color Adjust";

    this.addInput("image");

    this.addFloatProperty("vibrance", "Vibrance", 0.0, -1, 1, 0.01);
    this.addFloatProperty("saturation", "Saturation", 0.0, -1, 1, 0.01);
    this.addFloatProperty("temperature", "Temperature", 0.0, -1, 1, 0.01);
    this.addFloatProperty("tint", "Tint", 0.0, -1, 1, 0.01);
    this.addFloatProperty("hue", "Hue", 0.0, -1, 1, 0.01);

    this.addFloatProperty("brightness", "Brightness", 0.0, -1, 1, 0.01);
    this.addFloatProperty("exposure", "Exposure", 0.0, -1, 1, 0.01);
    this.addFloatProperty("contrast", "Contrast", 0.0, -1, 1, 0.01);
    this.addFloatProperty("black", "Black", 0.0, -1, 1, 0.01);
    this.addFloatProperty("white", "White", 0.0, -1, 1, 0.01);
    this.addFloatProperty("highlights", "Highlights", 0.0, -1, 1, 0.01);
    this.addFloatProperty("shadows", "Shadows", 0.0, -1, 1, 0.01);

    let source = `
        vec4 process(vec2 uv)
        {
            vec4 col = texture(image, uv);

            // hsl
            vec3 hsl = RGBtoHSL(col.rgb);
            hsl.r = fract(1.0 + hsl.r + prop_hue * 0.5);
            hsl.g = clamp(hsl.g * (1.0 + prop_saturation), 0.0, 1.0);
            col.rgb = HSLtoRGB(hsl);

            // hsv
            // vec3 hsv = RGBtoHSV(col.rgb);
            // hsv.r = fract(1.0 + hsv.r + prop_hue * 0.5);
            // hsv.g = clamp(hsv.g * (1.0 + prop_saturation), 0.0, 1.0);
            // col.rgb = HSVtoRGB(hsv);

            col.rgb = vibrance(vec4(col.rgb, 1.0), (prop_vibrance + 1.0)).rgb;

            // white balance - temperature, tint
            float range = 0.6666;
            float temperature = prop_temperature * range;
            float tint = -prop_tint * range;
            
            col.rgb = WhiteBalance(col.rgb, temperature, tint);
            
            col.rgb += prop_brightness;
            if (prop_contrast > 0.0)
                col.rgb = (col.rgb - 0.5) / (1.0 - prop_contrast) + 0.5;
            else
                col.rgb = (col.rgb - 0.5) * (1.0 + prop_contrast) + 0.5;

            if (prop_exposure > 0.0)
                col.rgb = clamp(col.rgb * (1.0 + prop_exposure * 2.0), 0.0, 1.0).rgb;
            else
                col.rgb = clamp(col.rgb * (1.0 + prop_exposure * 0.5), 0.0, 1.0).rgb;

            col.rgb = black_white(col.rgb, prop_black, prop_white);
            col.rgb = shadow_highlight(col.rgb, prop_shadows * 0.9, prop_highlights * 0.9);

            return col;
        }
        `;

    this.buildShader(source);
  }
}
