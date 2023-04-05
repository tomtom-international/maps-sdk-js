import { FillLayerSpecification, LineLayerSpecification } from "maplibre-gl";
import { LayerSpecTemplate } from "../../shared";
import { GEOMETRY_COLOR_PROP } from "../types/GeometryDisplayProps";

export const colorPalettes = {
    warm: [
        "#793F0D",
        "#AC703D",
        "#C38E63",
        "#E49969",
        "#E5AE86",
        "#EEC5A9",
        "#6E7649",
        "#9D9754",
        "#C7C397",
        "#B4A851",
        "#DFD27C",
        "#E7E3B5",
        "#846D74",
        "#B7A6AD",
        "#D3C9CE"
    ],
    browns: [
        "#edc4b3",
        "#e6b8a2",
        "#deab90",
        "#d69f7e",
        "#cd9777",
        "#c38e70",
        "#b07d62",
        "#9d6b53",
        "#8a5a44",
        "#774936"
    ],
    cold: ["#344464", "#548ca4", "#549cac", "#2c445c", "#a4ccd4", "#acbccc", "#b4c4d4", "#acd4cc", "#5c8ca4"],
    fadedBlues: [
        "#152033",
        "#1d2d44",
        "#2e455d",
        "#3e5c76",
        "#4c6884",
        "#597491",
        "#67809e",
        "#6e86a5",
        "#7b91ad",
        "#879bb4"
    ],
    blues: ["#03045e", "#023e8a", "#0077b6", "#0096c7", "#00b4d8", "#48cae4", "#90e0ef", "#ade8f4", "#caf0f8"],
    greens: ["#004b23", "#006400", "#007200", "#008000", "#38b000", "#70e000", "#9ef01a", "#ccff33"],
    fadedGreenToBlue: [
        "#d9ed92",
        "#b5e48c",
        "#99d98c",
        "#76c893",
        "#52b69a",
        "#34a0a4",
        "#168aad",
        "#1a759f",
        "#1e6091",
        "#184e77"
    ],
    blueToRed: [
        "#033270",
        "#1368aa",
        "#4091c9",
        "#9dcee2",
        "#fedfd4",
        "#f29479",
        "#f26a4f",
        "#ef3c2d",
        "#cb1b16",
        "#65010c"
    ],
    greenToYellow: [
        "#007f5f",
        "#2b9348",
        "#55a630",
        "#80b918",
        "#aacc00",
        "#bfd200",
        "#d4d700",
        "#dddf00",
        "#eeef20",
        "#ffff3f"
    ],
    pastel: [
        "#fec5bb",
        "#fcd5ce",
        "#fae1dd",
        "#f8edeb",
        "#e8e8e4",
        "#d8e2dc",
        "#ece4db",
        "#ffe5d9",
        "#ffd7ba",
        "#fec89a"
    ],
    retro: [
        "#f94144",
        "#f3722c",
        "#f8961e",
        "#f9844a",
        "#f9c74f",
        "#90be6d",
        "#43aa8b",
        "#4d908e",
        "#577590",
        "#277da1"
    ],
    contrastRetro: [
        "#001219",
        "#005f73",
        "#0a9396",
        "#94d2bd",
        "#e9d8a6",
        "#ee9b00",
        "#ca6702",
        "#bb3e03",
        "#ae2012",
        "#9b2226"
    ],
    fadedRainbow: ["#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#a0c4ff", "#bdb2ff", "#ffc6ff", "#fffffc"],
    pastelRainbow: [
        "#54478c",
        "#2c699a",
        "#048ba8",
        "#0db39e",
        "#16db93",
        "#83e377",
        "#b9e769",
        "#efea5a",
        "#f1c453",
        "#f29e4c"
    ]
};

export type ColorPaletteOptions = keyof typeof colorPalettes;

const defaultColor = "#0A3653";

export const geometryFillSpec: LayerSpecTemplate<FillLayerSpecification> = {
    type: "fill",
    paint: {
        "fill-color": ["coalesce", ["get", GEOMETRY_COLOR_PROP], defaultColor],
        "fill-opacity": 0.15,
        "fill-antialias": false
    }
};

export const geometryOutlineSpec: LayerSpecTemplate<LineLayerSpecification> = {
    type: "line",
    paint: {
        "line-color": defaultColor,
        "line-opacity": 0.45,
        "line-width": 2
    }
};

/**
 * Constants represent the layer position options
 */
export const BELLOW_COUNTRIES_LAYER_ID = "Places - Country name";
export const BELLOW_ALL_LABELS_LAYER_ID = "Borders - Treaty label";
export const BELLOW_ROADS_LAYER_ID = "Tunnel - Railway outline";
export const BELLOW_PLACE_LABELS_LAYER_ID = "Places - Village / Hamlet";
export const BELLOW_PLACE_LAYER_ID = "POI";

/**
 * Geometry Layers IDs
 */
export const GEOMETRY_FILL_LAYER_ID = "geometry_Fill";
export const GEOMETRY_OUTLINE_LAYER_ID = "geometry_Outline";
export const GEOMETRY_TITLE_LAYER_ID = "geometry_Title";
