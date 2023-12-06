import { SymbolLayerSpecification } from "maplibre-gl";
import { SELECTED_ROUTE_FILTER } from "./shared";
import { LayerSpecTemplate } from "../../shared";

/**
 * @ignore
 */
export const routeEVChargingStationSymbol: LayerSpecTemplate<SymbolLayerSpecification> = {
    filter: SELECTED_ROUTE_FILTER,
    type: "symbol",
    minzoom: 6,
    // zoom where the map POI naturally appears:
    maxzoom: 16.5,
    layout: {
        "symbol-placement": "point",
        "symbol-avoid-edges": true,
        "icon-image": "poi-charging_location", //TODO this is for Orbis
        "icon-size": ["interpolate", ["linear"], ["zoom"], 6, 0.8, 16.5, 1],
        // helps smooth the transition from along-route to map-poi, which also has a label in it:
        "icon-ignore-placement": true
    }
};
