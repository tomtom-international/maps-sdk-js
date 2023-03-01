import { ExpressionSpecification, LineLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";
import { MAP_BOLD_FONT } from "../../shared/layers/CommonLayerProps";
import { LayerSpecTemplate } from "../../shared";
import { SELECTED_ROUTE_FILTER } from "./shared";

const EXTRA_FOREGROUND_LINE_WIDTH: ExpressionSpecification = [
    "interpolate",
    ["linear"],
    ["zoom"],
    1,
    2,
    5,
    3,
    10,
    4,
    18,
    6
];

/**
 * @ignore
 */
export const routeIncidentsBGLine: LayerSpecTemplate<LineLayerSpecification> = {
    type: "line",
    layout: {
        "line-join": "round"
    },
    paint: {
        "line-width": EXTRA_FOREGROUND_LINE_WIDTH,
        "line-color": [
            "match",
            ["get", "magnitudeOfDelay"],
            "minor",
            "#FFC105",
            "moderate",
            "#FB2D09",
            "major",
            "#AD0000",
            // other
            "#C7D2D8"
        ]
    }
};

/**
 * @ignore
 */
export const routeIncidentsDashedLine: LayerSpecTemplate<LineLayerSpecification> = {
    type: "line",
    filter: ["in", ["get", "magnitudeOfDelay"], ["literal", ["unknown", "indefinite"]]],
    layout: {
        "line-join": "round"
    },
    paint: {
        "line-width": EXTRA_FOREGROUND_LINE_WIDTH,
        "line-color": [
            "match",
            ["get", "magnitudeOfDelay"],
            "unknown",
            "rgba(190, 39, 27, 1)",
            // other (undefined):
            "rgba(137, 150, 168, 1)"
        ],
        "line-dasharray": [1.5, 1]
    }
};

/**
 * @ignore
 */
export const routeIncidentsPatternLine: LayerSpecTemplate<LineLayerSpecification> = {
    type: "line",
    filter: ["in", ["get", "magnitudeOfDelay"], ["literal", ["minor", "moderate", "major"]]],
    layout: {
        "line-join": "round"
    },
    paint: {
        "line-width": EXTRA_FOREGROUND_LINE_WIDTH,
        "line-pattern": [
            "match",
            ["get", "magnitudeOfDelay"],
            "minor",
            "traffic-incidents-slow",
            "moderate",
            "traffic-incidents-queueing",
            "major",
            "traffic-incidents-stationary",
            // other
            "traffic-diagonal-unknown"
        ]
    }
};

/**
 * @ignore
 */
export const routeIncidentsSymbol: LayerSpecTemplate<SymbolLayerSpecification> = {
    filter: SELECTED_ROUTE_FILTER,
    type: "symbol",
    minzoom: 6,
    layout: {
        "symbol-placement": "point",
        "symbol-avoid-edges": true,
        "icon-anchor": "bottom",
        "icon-ignore-placement": true,
        "icon-size": ["interpolate", ["linear"], ["zoom"], 6, 0.8, 12, 1],
        "icon-image": ["get", "iconID"],
        "text-field": ["get", "title"],
        "text-font": [MAP_BOLD_FONT],
        "text-optional": true,
        "text-anchor": "top",
        "text-size": ["interpolate", ["linear"], ["zoom"], 6, 11, 10, 13]
    },
    paint: {
        "text-color": [
            "match",
            ["get", "magnitudeOfDelay"],
            "minor",
            "#f58240",
            "moderate",
            "#FB2D09",
            "major",
            "#AD0000",
            "indefinite",
            "#666666",
            //other
            "#000000"
        ],
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 1
    }
};
