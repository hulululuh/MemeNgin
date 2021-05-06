import { NodeCategory } from "../designer/designernode";
import { DesignerLibrary } from "../designer/library";
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
import { UvCoordNode } from "./nodes/uvcoordnode";
import { ColorPropertyNode } from "./nodes/colorpropertynode";
import { CopyNode } from "./nodes/copynode";
import { DetectNode } from "./nodes/detectnode";
import { DirectionalWarpNode } from "./nodes/directionalwarpnode";
import { FloatPropertyNode } from "./nodes/floatpropertynode";
import { Vector2PropertyNode } from "./nodes/vector2propertynode";
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
import { OverlayQuadNode } from "./nodes/overlayquadnode";
import { OpacityOverrideNode } from "./nodes/opacityoverridenode";
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
import { QrCodeNode } from "./nodes/qrcodenode";
import { ThresholdNode } from "./nodes/thresholdnode";
import { TileNode } from "./nodes/tilenode";
import { Transform2DNode } from "./nodes/transform2dnode";
import { ResizeNode } from "./nodes/resizenode";
import { KaleidoscopeNode } from "./nodes/kaleidoscopenode";
import { MosaicNode } from "./nodes/mosaicnode";
import { WarpNode } from "./nodes/warpnode";
import { WaveNode } from "./nodes/wavenode";
import { UvSwapNode } from "./nodes/uvswapnode";
import { MapFloatNode } from "./nodes/mapfloatnode";
import { AndGateNode } from "./nodes/andgatenode";
import { OrGateNode } from "./nodes/orgatenode";
import { XorGateNode } from "./nodes/xorgatenode";
import { NotGateNode } from "./nodes/notgatenode";
import { NumSelectorNode } from "./nodes/numselectornode";
import { ImgSelectorNode } from "./nodes/imgselectornode";
import { GreaterNode } from "./nodes/greaternode";
import { GreaterEqNode } from "./nodes/greatereqnode";
import { LessNode } from "./nodes/lessnode";
import { LessEqNode } from "./nodes/lesseqnode";

export const libraryMajorVersion = 0;
export const libraryMinorVersion = 1;

export function getCurrentLibraryVersion() {
  return libraryMajorVersion.toString() + "." + libraryMinorVersion.toString();
}

export function createLibrary() {
  let lib = new DesignerLibrary();
  lib.versionName = getCurrentLibraryVersion();
  lib.addNode(
    "transform2d",
    "Transform2D",
    Transform2DNode,
    NodeCategory.Shape
  );
  lib.addNode("resize", "Resize", ResizeNode, NodeCategory.Shape);
  lib.addNode("mirror", "Mirror", MirrorNode, NodeCategory.Shape);
  lib.addNode("tile", "Tile", TileNode, NodeCategory.Shape);
  lib.addNode("hexagon", "Hexagon", HexagonNode, NodeCategory.Shape);
  lib.addNode(
    "kaleidoscope",
    "Kaleidoscope",
    KaleidoscopeNode,
    NodeCategory.Shape
  );
  lib.addNode("mosaic", "Mosaic", MosaicNode, NodeCategory.Shape);
  lib.addNode("warp", "Warp", WarpNode, NodeCategory.Shape);
  lib.addNode(
    "directionalwarp",
    "Directional Warp",
    DirectionalWarpNode,
    NodeCategory.Shape
  );
  lib.addNode("blur", "Blur", BlurNode, NodeCategory.Shape);
  lib.addNode("slopeblur", "Slope Blur", SlopeBlurNode, NodeCategory.Shape);
  lib.addNode("normalmap", "Normal Map", NormalMapNode, NodeCategory.Shape);

  lib.addNode("color", "Color", ColorNode, NodeCategory.Color);
  lib.addNode("colorize", "Colorize", ColorizeNode, NodeCategory.Color);
  // TODO: need to support 16bit texture in order to convey texCoord details
  //lib.addNode("uvcoord", "UV Coord", UvCoordNode, NodeCategory.Color);
  lib.addNode(
    "coloradjust",
    "Color Adjust",
    ColorAdjustNode,
    NodeCategory.Color
  );
  lib.addNode("maprange", "Map Range", MapRangeNode, NodeCategory.Color);
  lib.addNode("invert", "Invert", InvertNode, NodeCategory.Color);
  lib.addNode("threshold", "Threshold", ThresholdNode, NodeCategory.Color);
  lib.addNode(
    "heightshift",
    "Height Shift",
    HeightShiftNode,
    NodeCategory.Color
  );
  lib.addNode(
    "gradientmap",
    "Gradient Map",
    GradientMapNode,
    NodeCategory.Color
  );
  lib.addNode(
    "brightnesscontrast",
    "Brightness Contrast",
    BrightnessContrastNode,
    NodeCategory.Color
  );
  lib.addNode("colorgrade", "Color Grade", ColorGradeNode, NodeCategory.Color);

  lib.addNode("overlay", "Overlay", OverlayNode, NodeCategory.Composite);
  lib.addNode("blend", "Blend", BlendNode, NodeCategory.Composite);
  lib.addNode(
    "overlayquad",
    "Overlay Quad",
    OverlayQuadNode,
    NodeCategory.Composite
  );
  lib.addNode("splat", "Splat", SplatNode, NodeCategory.Composite);
  lib.addNode("mask", "Mask", MaskNode, NodeCategory.Composite);
  lib.addNode(
    "opacityoverride",
    "Opacity Override",
    OpacityOverrideNode,
    NodeCategory.Composite
  );

  // TODO: 16 bit texture, for same reason above
  //lib.addNode("uvSwap", "Uv Swap", UvSwapNode, NodeCategory.Composite);

  lib.addNode("texture", "Texture", TextureNode, NodeCategory.Create);
  lib.addNode("text", "Text", TextNode, NodeCategory.Create);
  lib.addNode("polygon", "Polygon", PolygonNode, NodeCategory.Create);
  lib.addNode("circle", "Circle", CircleNode, NodeCategory.Create);
  lib.addNode(
    "checkerboard",
    "CheckerBoard",
    CheckerBoardNode,
    NodeCategory.Create
  );
  lib.addNode(
    "brickgenerator",
    "Brick Generator",
    BrickGeneratorNode,
    NodeCategory.Create
  );
  lib.addNode("cell", "Cell", CellNode, NodeCategory.Create);
  lib.addNode("solidcell", "Solid Cell", SolidCellNode, NodeCategory.Create);
  lib.addNode("linecell", "Line Cell", LineCellNode, NodeCategory.Create);
  lib.addNode("perlin3d", "Perlin 3D", Perlin3DNode, NodeCategory.Create);
  lib.addNode(
    "simplexnoise",
    "Simplex Noise",
    SimplexNoiseNode,
    NodeCategory.Create
  );
  lib.addNode(
    "fractalnoise",
    "Fractal Noise",
    FractalNoiseNode,
    NodeCategory.Create
  );
  lib.addNode("wave", "Wave", WaveNode, NodeCategory.Create);
  lib.addNode("gradient", "Gradient", GradientNode, NodeCategory.Create);
  lib.addNode(
    "trigradient",
    "TriGradient",
    TriGradientNode,
    NodeCategory.Create
  );

  lib.addNode("qrcode", "QrCode", QrCodeNode, NodeCategory.Create);

  lib.addNode(
    "colorproperty",
    "ColorProperty",
    ColorPropertyNode,
    NodeCategory.Logic
  );
  lib.addNode(
    "boolproperty",
    "BoolProperty",
    BoolPropertyNode,
    NodeCategory.Logic
  );
  lib.addNode(
    "floatproperty",
    "FloatProperty",
    FloatPropertyNode,
    NodeCategory.Logic
  );
  lib.addNode(
    "intproperty",
    "IntProperty",
    IntPropertyNode,
    NodeCategory.Logic
  );
  lib.addNode(
    "stringproperty",
    "StringProperty",
    StringPropertyNode,
    NodeCategory.Logic
  );
  lib.addNode(
    "vector2property",
    "Vector2Property",
    Vector2PropertyNode,
    NodeCategory.Logic
  );
  lib.addNode("copy", "Copy", CopyNode, NodeCategory.Logic);
  lib.addNode("output", "Output", OutputNode, NodeCategory.Logic);
  lib.addNode("detect", "Detect", DetectNode, NodeCategory.Logic);
  lib.addNode("stylize", "Stylize", StylizeNode, NodeCategory.Logic);
  lib.addNode("mapfloat", "MapFloat", MapFloatNode, NodeCategory.Logic);
  lib.addNode("andgate", "AndGate", AndGateNode, NodeCategory.Logic);
  lib.addNode("orgate", "OrGate", OrGateNode, NodeCategory.Logic);
  lib.addNode("xorgate", "XorGate", XorGateNode, NodeCategory.Logic);
  lib.addNode("notgate", "NotGate", NotGateNode, NodeCategory.Logic);
  lib.addNode(
    "numselector",
    "NumSelector",
    NumSelectorNode,
    NodeCategory.Logic
  );
  lib.addNode(
    "imgselector",
    "ImgSelector",
    ImgSelectorNode,
    NodeCategory.Logic
  );

  lib.addNode("greater", "GreaterNode", GreaterNode, NodeCategory.Logic);
  lib.addNode("greatereq", "GreaterEqNode", GreaterEqNode, NodeCategory.Logic);
  lib.addNode("less", "LessNode", LessNode, NodeCategory.Logic);
  lib.addNode("lesseq", "LessEqNode", LessEqNode, NodeCategory.Logic);

  return lib;
}
