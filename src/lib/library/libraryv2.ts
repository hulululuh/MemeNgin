import { BrickGeneratorNode } from "./v1/brickgenerator";
import { NormalMapNode, BetterWarpNode } from "./v1/normalmap";
import { CellNode } from "./v1/cellnode";
import { SolidCellNode } from "./v1/solidcell";
import { LineCellNode } from "./v1/linecell";
import { PolygonNode, CircleNode } from "./v1/shapes";
import { BlendNode } from "./v1/blend";
import { OverlayNode } from "./v1/overlay";
import { PrepareNode } from "./v1/prepare";
import { InvertNode } from "./v1/invert";
import { WarpNode } from "./v1/warp";
import { ColorNode, ColorizeNode } from "./v1/color";
import { TextNode } from "./v1/text";
import { SimplexNoiseNode } from "./v1/simplexnoise";
import { MaskNode } from "./v1/mask";
import { Transform2DNode } from "./v1/transform2d";
import { MapRangeNode } from "./v1/maprange";
import { Perlin3DNode } from "./v1/perlin3d";
import { HexagonNode } from "./v1/hexagon";
import { FractalNoiseNode } from "./v1/fractalnoise";
import { TileNode } from "./v1/tile";
import { ThresholdNode } from "./v1/threshold";
import { HeightShiftNode } from "./v1/heightshift";
import { CheckerBoardNode } from "./v1/checkerboard";
import { DirectionalWarpNode } from "./v1/directionalwarp";
import { MirrorNode } from "./v1/mirror";
import { BrightnessContrastNode } from "./v1/brightnesscontrast";
import { ColorGradeNode } from "./v1/colorgrade";
import { ColorAdjustNode } from "./v2/coloradjust";
import { WaveNode } from "./v1/wave";
import { CopyNode } from "./v1/copy";
import { TextureNode } from "./v1/texture";
import { GradientNode, TriGradientNode } from "./v1/gradient";
import { DesignerLibrary } from "../designer/library";
import { OutputNode } from "./v1/output";
import { GradientMapNode } from "./v1/gradientmap";
import { SplatNodeV2 } from "./v2/splat";
import { BlurV2 } from "./v2/blur";
import { AdvanceSplatterV2 } from "./v2/advancesplatter";
import { SlopeBlur } from "./v2/slopeblur";
import { TileSampler } from "./v2/tilesampler";
import { DetectNode } from "./v2/detect";
import { NodeCategory } from "../designer/designernode";

export function createLibrary() {
  let lib = new DesignerLibrary();
  lib.versionName = "v2";
  lib.addNode(
    "brickgenerator",
    "Brick Generator",
    BrickGeneratorNode,
    NodeCategory.Create
  );
  lib.addNode("cell", "Cell", CellNode, NodeCategory.Create);
  lib.addNode("solidcell", "Solid Cell", SolidCellNode, NodeCategory.Create);
  lib.addNode("linecell", "Line Cell", LineCellNode, NodeCategory.Create);
  lib.addNode("circle", "Circle", CircleNode, NodeCategory.Create);
  lib.addNode("polygon", "Polygon", PolygonNode, NodeCategory.Create);
  lib.addNode("blend", "Blend", BlendNode, NodeCategory.Composite);
  lib.addNode("overlay", "Overlay", OverlayNode, NodeCategory.Composite);
  lib.addNode("prepare", "Prepare", PrepareNode, NodeCategory.Shape);
  lib.addNode("invert", "Invert", InvertNode, NodeCategory.Color);
  lib.addNode("color", "Color", ColorNode, NodeCategory.Color);
  lib.addNode("colorize", "Colorize", ColorizeNode, NodeCategory.Color);
  lib.addNode("text", "Text", TextNode, NodeCategory.Create);
  lib.addNode(
    "simplexnoise",
    "Simplex Noise",
    SimplexNoiseNode,
    NodeCategory.Create
  );
  lib.addNode("mask", "Mask", MaskNode, NodeCategory.Composite);
  lib.addNode(
    "transform2d",
    "Transform2D",
    Transform2DNode,
    NodeCategory.Shape
  );
  lib.addNode("maprange", "Map Range", MapRangeNode, NodeCategory.Color);
  lib.addNode("splat", "Splat", SplatNodeV2, NodeCategory.Composite);
  lib.addNode("perlin3d", "Perlin 3D", Perlin3DNode, NodeCategory.Create);
  lib.addNode("hexagon", "Hexagon", HexagonNode, NodeCategory.Create);
  lib.addNode(
    "fractalnoise",
    "Fractal Noise",
    FractalNoiseNode,
    NodeCategory.Create
  );
  lib.addNode("warp", "Warp", WarpNode, NodeCategory.Shape);
  lib.addNode("tile", "Tile", TileNode, NodeCategory.Shape);
  lib.addNode("threshold", "Threshold", ThresholdNode, NodeCategory.Color);
  lib.addNode(
    "heightshift",
    "Height Shift",
    HeightShiftNode,
    NodeCategory.Color
  );
  lib.addNode(
    "checkerboard",
    "CheckerBoard",
    CheckerBoardNode,
    NodeCategory.Create
  );
  lib.addNode(
    "gradientmap",
    "Gradient Map",
    GradientMapNode,
    NodeCategory.Color
  );
  lib.addNode(
    "directionalwarp",
    "Directional Warp",
    DirectionalWarpNode,
    NodeCategory.Shape
  );
  lib.addNode("mirror", "Mirror", MirrorNode, NodeCategory.Shape);
  lib.addNode("tilesampler", "Tile Sampler", TileSampler, NodeCategory.Shape);
  lib.addNode("normalmap", "Normal Map", NormalMapNode, NodeCategory.Shape);
  lib.addNode(
    "brightnesscontrast",
    "Brightness Contrast",
    BrightnessContrastNode,
    NodeCategory.Color
  );
  lib.addNode("colorgrade", "Color Grade", ColorGradeNode, NodeCategory.Color);
  lib.addNode(
    "coloradjust",
    "Color Adjust",
    ColorAdjustNode,
    NodeCategory.Color
  );
  lib.addNode("wave", "Wave", WaveNode, NodeCategory.Create);
  lib.addNode("copy", "Copy", CopyNode, NodeCategory.Think);
  lib.addNode("gradient", "Gradient", GradientNode, NodeCategory.Create);
  lib.addNode("texture", "Texture", TextureNode, NodeCategory.Create);
  lib.addNode(
    "trigradient",
    "TriGradient",
    TriGradientNode,
    NodeCategory.Create
  );
  lib.addNode("output", "Output", OutputNode, NodeCategory.Think);
  lib.addNode("blurv2", "Blur", BlurV2, NodeCategory.Shape);
  lib.addNode("slopeblur", "Slope Blur", SlopeBlur, NodeCategory.Shape);
  lib.addNode(
    "advancesplatter",
    "Advance Splatter",
    AdvanceSplatterV2,
    NodeCategory.Composite
  );
  lib.addNode("detect", "Detect", DetectNode, NodeCategory.Think);

  return lib;
}
