import { CommonPlaceProps, Place, Places } from "@anw/go-sdk-js/core";
import { AbstractMapModule, GeoJSONSourceWithLayers, MapModuleConfig } from "../core";
import { placesLayerSpec } from "./layers/PlacesLayers";
import { poiClassificationToIconID } from "./poiIconIDMapping";
import { DisplayProps } from "./types/DisplayProps";

export const placesSourceID = "places";

/**
 * Builds the title of the place to display it on the map.
 * @param place The place to display.
 * @group MapPlaces
 * @category Functions
 */
export const buildPlaceTitle = (place: Place): string =>
    place.properties.poi?.name || place.properties.address.freeformAddress;

/**
 * Gets the map style sprite image ID to display on the map for the give place.
 * @param place The place to display.
 * @group MapPlaces
 * @category Functions
 */
export const getImageIDForPlace = (place: Place): string => {
    const classificationCode = place.properties.poi?.classifications?.[0]?.code;
    return `${classificationCode ? poiClassificationToIconID[classificationCode].toString() : "default"}_pin`;
};

const prepareForDisplay = (places: Places): Places<DisplayProps & CommonPlaceProps> => ({
    ...places,
    features: places.features.map((place) => ({
        ...place,
        properties: {
            ...place.properties,
            title: buildPlaceTitle(place),
            iconID: getImageIDForPlace(place)
        }
    }))
});

/**
 * @group MapPlaces
 * @category Functions
 */
export class GeoJSONPlaces extends AbstractMapModule<MapModuleConfig> {
    private places?: GeoJSONSourceWithLayers<Places>;

    protected init(): void {
        const placesLayerID = "placesSymbols";
        this.places = new GeoJSONSourceWithLayers(this.mapLibreMap, placesSourceID, [
            { ...placesLayerSpec, id: placesLayerID }
        ]);
        this.places.ensureAddedToMapWithVisibility(false);
    }

    /**
     * Shows the given places on the map.
     * @param places
     */
    show(places: Places): void {
        this.callWhenMapReady(() => this.places?.show(prepareForDisplay(places)));
    }

    /**
     * Clears the places from the map.
     */
    clear(): void {
        this.callWhenMapReady(() => this.places?.clear());
    }
}
