import type { LayerSpecTemplate } from "../../shared";
import type { ExpressionSpecification, SymbolLayerSpecification } from "maplibre-gl";
import { DESELECTED_SECONDARY_COLOR, SELECTED_ROUTE_FILTER } from "./shared";
import { DESELECTED_SUMMARY_POPUP_IMAGE_ID, SELECTED_SUMMARY_POPUP_IMAGE_ID } from "./routeMainLineLayers";
import { MAP_BOLD_FONT, MAP_MEDIUM_FONT } from "../../shared/layers/commonLayerProps";
import { magnitudeOfDelayTextColor } from "./routeTrafficSectionLayers";

/**
 * @ignore
 */
export const TRAFFIC_CLEAR_IMAGE_ID = "traffic-clear";
/**
 * @ignore
 */
export const TRAFFIC_MAJOR_IMAGE_ID = "traffic-major";
/**
 * @ignore
 */
export const TRAFFIC_MODERATE_IMAGE_ID = "traffic-moderate";
/**
 * @ignore
 */
export const TRAFFIC_MINOR_IMAGE_ID = "traffic-minor";

const hasFormattedTraffic: ExpressionSpecification = ["has", "formattedTraffic"];
/**
 * @ignore
 */
export const summaryBubbleSymbolPoint: LayerSpecTemplate<SymbolLayerSpecification> = {
    type: "symbol",
    layout: {
        "icon-image": [
            "case",
            SELECTED_ROUTE_FILTER,
            SELECTED_SUMMARY_POPUP_IMAGE_ID,
            DESELECTED_SUMMARY_POPUP_IMAGE_ID
        ],
        "symbol-placement": "point",
        "icon-rotation-alignment": "viewport",
        "text-rotation-alignment": "viewport",
        "symbol-sort-key": ["case", SELECTED_ROUTE_FILTER, 0, 1],
        "icon-text-fit": "both",
        "icon-text-fit-padding": [10, 5, 5, 10],
        "text-font": [MAP_MEDIUM_FONT],
        "text-size": 13,
        "icon-padding": 0,
        "text-justify": "left",
        "text-line-height": 1.5,
        "text-field": [
            "format",
            ["get", "formattedDuration"],
            {
                "text-font": ["literal", [MAP_BOLD_FONT]],
                "text-color": ["case", SELECTED_ROUTE_FILTER, "black", DESELECTED_SECONDARY_COLOR]
            },
            "    ",
            ["get", "formattedDistance"],
            { "text-color": DESELECTED_SECONDARY_COLOR },
            ["case", hasFormattedTraffic, "\n", ""],
            {},
            [
                "image",
                [
                    "case",
                    hasFormattedTraffic,
                    [
                        "match",
                        ["get", "magnitudeOfDelay"],
                        "major",
                        TRAFFIC_MAJOR_IMAGE_ID,
                        "moderate",
                        TRAFFIC_MODERATE_IMAGE_ID,
                        "minor",
                        TRAFFIC_MINOR_IMAGE_ID,
                        TRAFFIC_CLEAR_IMAGE_ID
                    ],
                    ""
                ]
            ],
            {},
            ["concat", "  ", ["get", "formattedTraffic"]],
            {
                "text-font": ["literal", [MAP_BOLD_FONT]],
                "text-color": magnitudeOfDelayTextColor
            }
        ]
    },
    paint: {
        "icon-translate": [0, -35],
        "text-translate": [0, -35]
    }
};
