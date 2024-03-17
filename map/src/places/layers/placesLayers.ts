import type {
    DataDrivenPropertyValueSpecification,
    ExpressionSpecification,
    Map,
    SymbolLayerSpecification
} from "maplibre-gl";
import type { LayerSpecTemplate, SymbolLayerSpecWithoutSource } from "../../shared";
import { DEFAULT_TEXT_SIZE, MAP_BOLD_FONT } from "../../shared/layers/commonLayerProps";
import { ICON_ID, TITLE } from "../types/placeDisplayProps";
import type { PlacesModuleConfig } from "../types/placesModuleConfig";

/**
 * @ignore
 */
export const hasEventState: ExpressionSpecification = ["has", "eventState"];

/**
 * @ignore
 */
export const SELECTED_COLOR = "#3f9cd9";

/**
 * @ignore
 */
export const PIN_ICON_SIZE: ExpressionSpecification = ["interpolate", ["linear"], ["zoom"], 10, 0.7, 16, 0.85];

const isClick: ExpressionSpecification = ["in", ["get", "eventState"], ["literal", ["click", "contextmenu"]]];

const placesPinLayerBaseSpec: LayerSpecTemplate<SymbolLayerSpecification> = {
    type: "symbol",
    layout: {
        "icon-image": ["case", isClick, "default_pin", ["get", ICON_ID]],
        "icon-anchor": "bottom",
        "icon-allow-overlap": true,
        "icon-padding": 0,
        "icon-size": PIN_ICON_SIZE,
        "text-field": ["get", TITLE],
        "text-anchor": "top",
        "text-offset": [0, 0.5],
        "text-font": [MAP_BOLD_FONT],
        "text-size": DEFAULT_TEXT_SIZE,
        "text-padding": 5,
        "text-optional": true
    },
    paint: {
        "icon-translate": [0, 5],
        "icon-translate-anchor": "viewport",
        "text-color": "#333333",
        "text-halo-color": "#FFFFFF",
        "text-halo-width": ["interpolate", ["linear"], ["zoom"], 6, 1, 10, 1.5],
        "text-translate-anchor": "viewport"
    }
};

/**
 * @ignore
 */
export const placesLayerSpec: LayerSpecTemplate<SymbolLayerSpecification> = {
    ...placesPinLayerBaseSpec,
    filter: ["!", hasEventState]
};

/**
 * We use an extra layer for highlighted text since it's not easy to enforce z-ordering with icons and text
 * while text has different collision rules.
 * @ignore
 */
export const selectedPlaceLayerSpec: LayerSpecTemplate<SymbolLayerSpecification> = {
    ...placesPinLayerBaseSpec,
    filter: hasEventState,
    layout: {
        ...placesPinLayerBaseSpec.layout,
        "icon-size": 1,
        "text-allow-overlap": true
    },
    paint: {
        ...placesPinLayerBaseSpec.paint,
        "text-color": SELECTED_COLOR
    }
};

/**
 * @ignore
 */
export const clickedPlaceLayerSpec: LayerSpecTemplate<SymbolLayerSpecification> = {
    ...selectedPlaceLayerSpec,
    filter: isClick
};

const withConfig = (
    layerSpec: LayerSpecTemplate<SymbolLayerSpecification>,
    config: PlacesModuleConfig | undefined,
    id: string
): SymbolLayerSpecWithoutSource => {
    const textConfig = config?.textConfig;
    return {
        ...layerSpec,
        id,
        layout: {
            ...layerSpec.layout,
            ...(textConfig?.textSize && { "text-size": textConfig.textSize }),
            ...(textConfig?.textFont && { "text-font": textConfig.textFont }),
            ...(textConfig?.textOffset && { "text-offset": textConfig.textOffset }),
            ...(textConfig?.textField &&
                typeof textConfig?.textField !== "function" && {
                    "text-field": textConfig?.textField
                })
        },
        paint: {
            ...layerSpec.paint,
            ...(textConfig?.textColor && { "text-color": textConfig.textColor }),
            ...(textConfig?.textHaloColor && { "text-halo-color": textConfig.textHaloColor }),
            ...(textConfig?.textHaloWidth && { "text-halo-width": textConfig.textHaloWidth })
        }
    };
};

/**
 * @ignore
 */
export const getTextSizeSpec = (
    textSize?: DataDrivenPropertyValueSpecification<number>
): DataDrivenPropertyValueSpecification<number> => {
    return JSON.parse(JSON.stringify(textSize)?.replace(/name/g, TITLE));
};

const buildPOILikeLayerSpec = (map: Map): LayerSpecTemplate<SymbolLayerSpecification> => {
    const poiLayer = (map.getStyle().layers.filter((layer) => layer.id == "POI")[0] as SymbolLayerSpecification) || {};
    const textSize = (poiLayer.layout as SymbolLayerSpecification["layout"])?.["text-size"];
    return {
        filter: ["!", isClick],
        type: "symbol",
        paint: poiLayer.paint,
        layout: {
            ...poiLayer.layout,
            "text-field": ["get", TITLE],
            "icon-image": ["get", ICON_ID],
            ...(textSize && { "text-size": getTextSizeSpec(textSize) })
        }
    };
};

/**
 * @ignore
 */
export const buildPlacesLayerSpecs = (
    config: PlacesModuleConfig | undefined,
    idPrefix: string,
    map: Map
): [SymbolLayerSpecWithoutSource, SymbolLayerSpecWithoutSource] => {
    const layerSpecs =
        config?.iconConfig?.iconStyle == "poi-like"
            ? [buildPOILikeLayerSpec(map), clickedPlaceLayerSpec]
            : [placesLayerSpec, selectedPlaceLayerSpec];
    // (The first layer is the main one, the next one, on top, is used for the "selected" place)
    return layerSpecs.map((spec, index) =>
        withConfig(spec, config, `${idPrefix}-${index == 0 ? "main" : "selected"}`)
    ) as [SymbolLayerSpecWithoutSource, SymbolLayerSpecWithoutSource];
};
