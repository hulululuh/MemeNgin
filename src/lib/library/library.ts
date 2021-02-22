import { BrickGeneratorNode } from "./nodes/brickgenerator";
import { NormalMapNode, BetterWarpNode } from "./nodes/normalmap";
import { CellNode } from "./nodes/cellnode";
import { SolidCellNode } from "./nodes/solidcell";
import { LineCellNode } from "./nodes/linecell";
import { PolygonNode, CircleNode } from "./nodes/shapes";
import { BlendNode } from "./nodes/blend";
import { OverlayNode } from "./nodes/overlay";
import { InvertNode } from "./nodes/invert";
import { WarpNode } from "./nodes/warp";
import { ColorNode, ColorizeNode } from "./nodes/color";
import { TextNode } from "./nodes/text";
import { SimplexNoiseNode } from "./nodes/simplexnoise";
import { MaskNode } from "./nodes/mask";
import { Transform2DNode } from "./nodes/transform2d";
import { MapRangeNode } from "./nodes/maprange";
import { Perlin3DNode } from "./nodes/perlin3d";
import { HexagonNode } from "./nodes/hexagon";
import { FractalNoiseNode } from "./nodes/fractalnoise";
import { TileNode } from "./nodes/tile";
import { ThresholdNode } from "./nodes/threshold";
import { HeightShiftNode } from "./nodes/heightshift";
import { CheckerBoardNode } from "./nodes/checkerboard";
import { DirectionalWarpNode } from "./nodes/directionalwarp";
import { MirrorNode } from "./nodes/mirror";
import { BrightnessContrastNode } from "./nodes/brightnesscontrast";
import { ColorGradeNode } from "./nodes/colorgrade";
import { ColorAdjustNode } from "./nodes/coloradjust";
import { WaveNode } from "./nodes/wave";
import { CopyNode } from "./nodes/copy";
import { TextureNode } from "./nodes/texture";
import { GradientNode, TriGradientNode } from "./nodes/gradient";
import { OutputNode } from "./nodes/output";
import { GradientMapNode } from "./nodes/gradientmap";
import { SplatNode } from "./nodes/splat";
import { BlurNode } from "./nodes/blur";
import { AdvanceSplatterNode } from "./nodes/advancesplatter";
import { SlopeBlurNode } from "./nodes/slopeblur";
import { TileSamplerNode } from "./nodes/tilesampler";
import { DetectNode } from "./nodes/detect";
import { StylizeNode } from "./nodes/stylize";

import { BoolPropertyNode } from "./nodes/boolpropertynode";
import { FloatPropertyNode } from "./nodes/floatpropertynode";
import { IntPropertyNode } from "./nodes/intpropertynode";
import { StringPropertyNode } from "./nodes/stringpropertynode";
import { ColorPropertyNode } from "./nodes/colorpropertynode";

import { NodeCategory } from "../designer/designernode";
import { DesignerLibrary } from "../designer/library";

export const libraryMajorVersion = 0;
export const libraryMinorVersion = 1;

export function getCurrentLibraryVersion() {
  return libraryMajorVersion.toString() + "." + libraryMinorVersion.toString();
}

export function createLibrary() {
  let lib = new DesignerLibrary();
  lib.versionName = getCurrentLibraryVersion();
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
  lib.addNode("splat", "Splat", SplatNode, NodeCategory.Composite);
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
  lib.addNode(
    "tilesampler",
    "Tile Sampler",
    TileSamplerNode,
    NodeCategory.Shape
  );
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
  lib.addNode("blurnodes", "Blur", BlurNode, NodeCategory.Shape);
  lib.addNode("slopeblur", "Slope Blur", SlopeBlurNode, NodeCategory.Shape);
  lib.addNode(
    "advancesplatter",
    "Advance Splatter",
    AdvanceSplatterNode,
    NodeCategory.Composite
  );
  lib.addNode("detect", "Detect", DetectNode, NodeCategory.Think);
  lib.addNode("stylize", "Stylize", StylizeNode, NodeCategory.Think);
  lib.addNode(
    "boolProperty",
    "BoolProperty",
    BoolPropertyNode,
    NodeCategory.Think
  );
  lib.addNode(
    "floatproperty",
    "FloatProperty",
    FloatPropertyNode,
    NodeCategory.Think
  );
  lib.addNode(
    "intproperty",
    "IntProperty",
    IntPropertyNode,
    NodeCategory.Think
  );
  lib.addNode(
    "stringproperty",
    "StringProperty",
    StringPropertyNode,
    NodeCategory.Think
  );
  lib.addNode(
    "colorproperty",
    "ColorProperty",
    ColorPropertyNode,
    NodeCategory.Think
  );

  return lib;
}
