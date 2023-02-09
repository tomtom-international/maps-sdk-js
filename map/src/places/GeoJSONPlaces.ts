import { Places } from "@anw/go-sdk-js/core";
import {
    AbstractMapModule,
    EventsModule,
    GeoJSONSourceWithLayers,
    PLACES_SOURCE_ID,
    ToBeAddedLayerSpec
} from "../core";
import { PlaceIconConfig, PlaceModuleConfig } from "./types/PlaceModuleConfig";
import { GOSDKMap } from "../GOSDKMap";
import { waitUntilMapIsReady } from "../utils/mapUtils";
import { SymbolLayerSpecification } from "maplibre-gl";
import { changePlacesLayerSpecs, getPlacesLayerSpec, preparePlacesForDisplay } from "./preparePlacesForDisplay";

/**
 * @group MapPlaces
 * @category Functions
 */
export class GeoJSONPlaces extends AbstractMapModule<PlaceModuleConfig> {
    private readonly places: GeoJSONSourceWithLayers<Places>;

    private constructor(goSDKMap: GOSDKMap, config?: PlaceModuleConfig) {
        super(goSDKMap, config);
        const layerSpec = getPlacesLayerSpec(config?.iconConfig, this.mapLibreMap);
        this.places = new GeoJSONSourceWithLayers(this.mapLibreMap, PLACES_SOURCE_ID, [
            layerSpec as ToBeAddedLayerSpec<SymbolLayerSpecification>
        ]);

        if (config) {
            this.applyConfig(config);
        }
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

    applyConfig(config: PlaceModuleConfig): void {
        this.config = config;
        if (config.iconConfig) {
            this.applyIconConfig(config.iconConfig);
        }
    }

    resetConfig(): void {
        this.applyConfig({});
    }

    /**
     * Apply icon configuration on shown features.
     * @param iconConfig the icon config to apply
     */
    applyIconConfig(iconConfig: PlaceIconConfig): void {
        this.config = {
            ...this.config,
            iconConfig
        };
        changePlacesLayerSpecs(iconConfig, this.mapLibreMap);
        this.show(this.places.shownFeatures);
    }

    /**
     * Shows the given places on the map.
     * @param places
     */
    show(places: Places): void {
        this.places.show(preparePlacesForDisplay(places, this.mapLibreMap, this.config));
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
