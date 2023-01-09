import { CommonPlaceProps, Place, Places } from "@anw/go-sdk-js/core";
import { AbstractMapModule, GeoJSONSourceWithLayers, EventsModule, EventsProxy } from "../core";
import { placesLayerSpec } from "./layers/PlacesLayers";
import { poiClassificationToIconID } from "./poiIconIDMapping";
import { PlaceDisplayProps } from "./types/PlaceDisplayProps";
import { asDefined } from "../core/AssertionUtils";
import { PLACES_SOURCE_ID } from "../core/layers/sourcesIDs";
import { VectorTilesPlaceModuleConfig } from "./types/PlaceModuleConfig";

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
    const iconID = (classificationCode && poiClassificationToIconID[classificationCode]?.toString()) || "default";
    return `${iconID}_pin`;
};

const prepareForDisplay = (places: Places): Places<PlaceDisplayProps & CommonPlaceProps> => ({
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
export class GeoJSONPlaces extends AbstractMapModule<VectorTilesPlaceModuleConfig> {
    private places?: GeoJSONSourceWithLayers<Places>;

    protected init(eventsProxy: EventsProxy, config?: VectorTilesPlaceModuleConfig): void {
        const placesLayerID = "placesSymbols";
        this.places = new GeoJSONSourceWithLayers(this.mapLibreMap, PLACES_SOURCE_ID, [
            { ...placesLayerSpec, id: placesLayerID }
        ]);

        if (config?.interactive && this.places) {
            eventsProxy.add(this.places);
        }
    }

    /**
     * Shows the given places on the map.
     * @param places
     */
    show(places: Places): void {
        this.callWhenMapReady(() => asDefined(this.places).show(prepareForDisplay(places)));
    }

    /**
     * Clears the places from the map.
     */
    clear(): void {
        this.callWhenMapReady(() => asDefined(this.places).clear());
    }

    get events(): EventsModule {
        return new EventsModule(this.goSDKMap._eventsProxy, this.places);
    }
}
