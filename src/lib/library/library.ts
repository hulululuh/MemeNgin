import { NodeCategory } from "../designer/designernode";
import { DesignerLibrary } from "../designer/library";
import { AdvanceSplatterNode } from "./nodes/advancesplatternode";
import { BlendNode } from "./nodes/blendnode";
import { BlurNode } from "./nodes/blurnode";
import { BoolPropertyNode } from "./nodes/boolpropertynode";
import { BrickGeneratorNode } from "./nodes/brickgeneratornode";
import { BrightnessContrastNode } from "./nodes/brightnesscontrastnode";
import { CellNode } from "./nodes/cellnode";
import { CheckerBoardNode } from "./nodes/checkerboardnode";
import { ColorAdjustNode } from "./nodes/coloradjustnode";
import { ColorGradeNode } from "./nodes/colorgradenode";
import { ColorizeNode, ColorNode } from "./nodes/colornode";
import { ColorPropertyNode } from "./nodes/colorpropertynode";
import { CopyNode } from "./nodes/copynode";
import { DetectNode } from "./nodes/detectnode";
import { DirectionalWarpNode } from "./nodes/directionalwarpnode";
import { FloatPropertyNode } from "./nodes/floatpropertynode";
import { FractalNoiseNode } from "./nodes/fractalnoisenode";
import { GradientMapNode } from "./nodes/gradientmapnode";
import { GradientNode, TriGradientNode } from "./nodes/gradientnode";
import { HeightShiftNode } from "./nodes/heightshiftnode";
import { HexagonNode } from "./nodes/hexagonnode";
import { IntPropertyNode } from "./nodes/intpropertynode";
import { InvertNode } from "./nodes/invertnode";
import { LineCellNode } from "./nodes/linecellnode";
import { MapRangeNode } from "./nodes/maprangenode";
import { MaskNode } from "./nodes/masknode";
import { MirrorNode } from "./nodes/mirrornode";
import { NormalMapNode } from "./nodes/normalmapnode";
import { OutputNode } from "./nodes/outputnode";
import { OverlayNode } from "./nodes/overlaynode";
import { Perlin3DNode } from "./nodes/perlin3dnode";
import { CircleNode, PolygonNode } from "./nodes/shapesnodes";
import { SimplexNoiseNode } from "./nodes/simplexnoisenode";
import { SlopeBlurNode } from "./nodes/slopeblurnode";
import { SolidCellNode } from "./nodes/solidcellnode";
import { SplatNode } from "./nodes/splatnode";
import { StringPropertyNode } from "./nodes/stringpropertynode";
import { StylizeNode } from "./nodes/stylizenode";
import { TextNode } from "./nodes/textnode";
import { TextureNode } from "./nodes/texturenode";
import { ThresholdNode } from "./nodes/thresholdnode";
import { TileNode } from "./nodes/tilenode";
import { TileSamplerNode } from "./nodes/tilesamplernode";
import { Transform2DNode } from "./nodes/transform2dnode";
import { WarpNode } from "./nodes/warpnode";
import { WaveNode } from "./nodes/wavenode";

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