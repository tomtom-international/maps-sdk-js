import { CommonPlaceProps, Place, Places } from "@anw/go-sdk-js/core";
import { AbstractMapModule, EventsModule, GeoJSONSourceWithLayers, PLACES_SOURCE_ID } from "../core";
import { placesLayerSpec } from "./layers/PlacesLayers";
import { POIClassification, poiClassificationToIconID } from "./poiIconIDMapping";
import { PlaceDisplayProps } from "./types/PlaceDisplayProps";
import { PlaceModuleConfig } from "./types/PlaceModuleConfig";
import { GOSDKMap } from "../GOSDKMap";
import { waitUntilMapIsReady } from "../utils/mapUtils";

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
    const classificationCode = place.properties.poi?.classifications?.[0]?.code as POIClassification;
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
export class GeoJSONPlaces extends AbstractMapModule<PlaceModuleConfig> {
    private readonly places: GeoJSONSourceWithLayers<Places>;

    private constructor(goSDKMap: GOSDKMap, config?: PlaceModuleConfig) {
        super(goSDKMap, config);

        const placesLayerID = "placesSymbols";
        this.places = new GeoJSONSourceWithLayers(this.mapLibreMap, PLACES_SOURCE_ID, [
            { ...placesLayerSpec, id: placesLayerID }
        ]);

        if (config?.interactive && this.places) {
            goSDKMap._eventsProxy.add(this.places);
        }
    }

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param goSDKMap The GOSDKMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(goSDKMap: GOSDKMap, config?: PlaceModuleConfig): Promise<GeoJSONPlaces> {
        await waitUntilMapIsReady(goSDKMap);
        return new GeoJSONPlaces(goSDKMap, config);
    }

    /**
     * Shows the given places on the map.
     * @param places
     */
    show(places: Places): void {
        this.places.show(prepareForDisplay(places));
    }

    /**
     * Clears the places from the map.
     */
    clear(): void {
        this.places.clear();
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.goSDKMap._eventsProxy, this.places);
    }
}
