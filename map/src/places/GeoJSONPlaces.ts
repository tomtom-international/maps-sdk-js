import { Places, Place } from "@anw/go-sdk-js/core";
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
import { changeLayoutAndPaintProps, getPlacesLayerSpec, preparePlacesForDisplay } from "./preparePlacesForDisplay";

/**
 * @group MapPlaces
 * @category Functions
 */
export class GeoJSONPlaces extends AbstractMapModule<PlaceModuleConfig> {
    private places!: GeoJSONSourceWithLayers<Places>;
    private layerSpec!: Omit<SymbolLayerSpecification, "source">;

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

    protected initSourcesWithLayers(config?: PlaceModuleConfig) {
        const layerSpec = getPlacesLayerSpec(config?.iconConfig, this.mapLibreMap);
        this.places = new GeoJSONSourceWithLayers(this.mapLibreMap, PLACES_SOURCE_ID, [
            layerSpec as ToBeAddedLayerSpec<SymbolLayerSpecification>
        ]);
        this.layerSpec = layerSpec;
    }

    protected _applyConfig(config: PlaceModuleConfig | undefined) {
        if (config?.iconConfig) {
            this.applyIconConfig(config.iconConfig);
        }

        if (config?.interactive) {
            this.goSDKMap._eventsProxy.ensureAdded(this.places);
        }
    }

    /**
     * Apply icon configuration on shown features.
     * @param iconConfig the icon config to apply
     */
    applyIconConfig(iconConfig: PlaceIconConfig): void {
        const newLayerSpec = getPlacesLayerSpec(iconConfig, this.mapLibreMap);
        changeLayoutAndPaintProps(newLayerSpec, this.layerSpec, this.mapLibreMap);
        this.config = {
            ...this.config,
            iconConfig
        };
        this.layerSpec = newLayerSpec;
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
        return new EventsModule<Place>(this.goSDKMap._eventsProxy, this.places);
    }
}
