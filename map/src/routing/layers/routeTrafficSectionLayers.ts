import { ExpressionSpecification, LineLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";
import { MAP_BOLD_FONT } from "../../core/layers/CommonLayerProps";
import { LayerSpecTemplate } from "../../core";

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
            "MINOR",
            "#FFC105",
            "MODERATE",
            "#FB2D09",
            "MAJOR",
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
    filter: ["in", "magnitudeOfDelay", "UNKNOWN", "UNDEFINED"],
    layout: {
        "line-join": "round"
    },
    paint: {
        "line-width": EXTRA_FOREGROUND_LINE_WIDTH,
        "line-color": [
            "match",
            ["get", "magnitudeOfDelay"],
            "UNKNOWN",
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
    filter: ["in", "magnitudeOfDelay", "MINOR", "MODERATE", "MAJOR"],
    layout: {
        "line-join": "round"
    },
    paint: {
        "line-width": EXTRA_FOREGROUND_LINE_WIDTH,
        "line-pattern": [
            "match",
            ["get", "magnitudeOfDelay"],
            "MINOR",
            "traffic-incidents-slow",
            "MODERATE",
            "traffic-incidents-queueing",
            "MAJOR",
            "traffic-incidents-stationary",
            // other
            "traffic-diagonal-unknown"
        ]
    }
};

/**
 * @ignore
 */
export const routeIncidentsPointSymbol: LayerSpecTemplate<SymbolLayerSpecification> = {
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
            "MINOR",
            "#f58240",
            "MODERATE",
            "#FB2D09",
            "MAJOR",
            "#AD0000",
            "UNDEFINED",
            "#666666",
            //other
            "#000000"
        ],
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 1
    }
};
