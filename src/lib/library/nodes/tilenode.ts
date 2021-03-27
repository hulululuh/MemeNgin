import { ImageDesignerNode } from "@/lib/designer/imagedesignernode";

export class TileNode extends ImageDesignerNode {
  init() {
    this.title = "Tile";

    this.addInput("image");

    this.addFloatProperty("offset", "Offset", 0.5, 0, 1, 0.1);

    // brick size
    this.addFloatProperty("brickWidth", "Tile Width", 1.0, 0, 1, 0.01);
    this.addFloatProperty("brickHeight", "Tile Height", 1.0, 0, 1, 0.01);

    this.addIntProperty("rows", "Rows", 3, 1, 20, 1);
    this.addIntProperty("columns", "Columns", 3, 1, 20, 1);

    let source = `
        // offset for alternating rows
            
        vec2 is_brick(vec2 pos)
        {
            vec2 brickSize = vec2(prop_brickWidth, prop_brickHeight);

            vec2 edgeSize = (vec2(1.0) - brickSize) * vec2(0.5);
            vec2 brick = vec2(0.0);
            
            if (pos.x > edgeSize.x && pos.x < (1.0 - edgeSize.x))
                brick.x = 1.0;
                
            if (pos.y > edgeSize.y && pos.y < (1.0 - edgeSize.y))
                brick.y = 1.0;
                
            return brick;
        }

        vec4 process(vec2 uv)
        {
            float offset = prop_offset;
            vec2 tileSize = vec2(float(prop_rows), float(prop_columns));
            vec2 pos = uv * tileSize;
            
            float xOffset = 0.0;
            if (fract(pos.y * 0.5) > 0.5) {
                xOffset = offset;
            }
            pos.x += xOffset;
            
            // a brick's id would be floor(pos)
            // this gives us its origin
            // this can act as a random seed for the entire brick
            vec2 brickId = floor(pos);// - vec2(xOffset, 0);

            // wrap around x
            if (brickId.x > tileSize.x-1.0)
                brickId.x = 0.0;

            // this brings it to the range of 0 - 1
            // perfect for sampling texture
            vec2 cCoord = pos;
            pos = fract(pos);
            
            vec2 isBrick =is_brick(pos);

            if (image_connected) {
                vec4 col = texture(image, pos);
                return vec4(col.rgb, isBrick.x * isBrick.y * col.a);
            } else {
                cCoord = (pos - vec2(0.5)) * 4.0;
                bool checker = UVtoCheck(cCoord);
                
                float w = 0.125;
                
                vec3 color = vec3(clamp(pos, 0.0, 1.0), 0.0)*(1.0-w) + (checker ? vec3(1.0) : vec3(0.0, 0.0, 1.0))*(w);

                // draw uv coord instead
                return vec4(color, 1.0);
            }
            
        }
        `;

    this.buildShader(source);
  }
}
