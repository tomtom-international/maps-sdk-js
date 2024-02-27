import { LayerSpecTemplate } from "../../shared";
import { LineLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";
import { SELECTED_ROUTE_FILTER } from "./shared";

const commonProps = {
    filter: SELECTED_ROUTE_FILTER,
    minzoom: 16
};

const commonLineProps: LayerSpecTemplate<LineLayerSpecification> = {
    ...commonProps,
    type: "line",
    layout: { "line-cap": "round" }
};

/**
 * @ignore
 */
export const instructionOutline: LayerSpecTemplate<LineLayerSpecification> = {
    ...commonLineProps,
    paint: {
        "line-width": ["interpolate", ["linear"], ["zoom"], 16, 14, 22, 20],
        "line-color": "grey"
    }
};

/**
 * @ignore
 */
export const instructionLine: LayerSpecTemplate<LineLayerSpecification> = {
    ...commonLineProps,
    paint: {
        "line-width": ["interpolate", ["linear"], ["zoom"], 16, 12, 22, 17],
        "line-color": "white"
    }
};

/**
 * @ignore
 */
export const INSTRUCTION_ARROW_IMAGE_ID = "instruction-arrow";

/**
 * @ignore
 */
export const instructionArrow: LayerSpecTemplate<SymbolLayerSpecification> = {
    ...commonProps,
    type: "symbol",
    layout: {
        "icon-allow-overlap": true,
        "icon-image": INSTRUCTION_ARROW_IMAGE_ID,
        "icon-rotation-alignment": "map",
        "icon-rotate": ["get", "lastPointBearingDegrees"],
        "icon-size": ["interpolate", ["linear"], ["zoom"], 16, 1, 22, 2]
    }
};
