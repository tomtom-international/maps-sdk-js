/**
 * Key layer IDs from the vector map style.
 */
export const mapStyleLayerIDs = {
    /**
     * The country name layer.
     */
    country: "Places - Country name",
    /**
     * The lowest layer for place labels.
     */
    lowestPlaceLabel: "Places - Village / Hamlet",
    /**
     * The map POIs layer.
     */
    poi: "POI",
    /**
     * The lowest labels layer.
     */
    lowestLabel: "Borders - Treaty label",
    /**
     * The lowest lines layer.
     */
    lowestRoadLine: "Tunnel - Railway outline",
    /**
     * Buildings lowest layer.
     * * Not applicable to the Satellite style.
     */
    lowestBuilding: "Buildings - Underground"
} as const;
