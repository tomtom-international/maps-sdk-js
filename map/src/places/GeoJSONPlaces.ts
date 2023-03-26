import { Place, Places } from "@anw/maps-sdk-js/core";
import {
    AbstractMapModule,
    EventsModule,
    GeoJSONSourceWithLayers,
    PLACES_SOURCE_PREFIX_ID,
    SymbolLayerSpecWithoutSource
} from "../shared";
import { PlaceIconConfig, PlaceModuleConfig, PlaceTextConfig } from "./types/PlaceModuleConfig";
import { TomTomMap } from "../TomTomMap";
import { changeLayersProps, waitUntilMapIsReady } from "../shared/mapUtils";
import { preparePlacesForDisplay } from "./preparePlacesForDisplay";
import { buildPlacesLayerSpecs } from "./layers/PlacesLayers";
import { DisplayPlaceProps } from "./types/PlaceDisplayProps";

/**
 * IDs of sources and layers for places module.
 */
type PlacesSourcesAndLayers = {
    /**
     * Places source id with corresponding layers ids.
     */
    places: GeoJSONSourceWithLayers<Places<DisplayPlaceProps>>;
};

export class GeoJSONPlaces extends AbstractMapModule<PlacesSourcesAndLayers, PlaceModuleConfig> {
    private static lastInstanceIndex = -1;
    private layerSpecs!: [SymbolLayerSpecWithoutSource, SymbolLayerSpecWithoutSource];
    private sourceID!: string;
    private layerIDPrefix!: string;

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(tomtomMap: TomTomMap, config?: PlaceModuleConfig): Promise<GeoJSONPlaces> {
        await waitUntilMapIsReady(tomtomMap);
        return new GeoJSONPlaces(tomtomMap, config);
    }

    protected _initSourcesWithLayers(config?: PlaceModuleConfig, restore?: boolean): PlacesSourcesAndLayers {
        if (!restore) {
            GeoJSONPlaces.lastInstanceIndex++;
            this.sourceID = `${PLACES_SOURCE_PREFIX_ID}-${GeoJSONPlaces.lastInstanceIndex}`;
            this.layerIDPrefix = `placesSymbols-${GeoJSONPlaces.lastInstanceIndex}`;
        }
        const layerSpecs = buildPlacesLayerSpecs(config, this.layerIDPrefix, this.mapLibreMap);
        this.layerSpecs = layerSpecs;
        return { places: new GeoJSONSourceWithLayers(this.mapLibreMap, this.sourceID, layerSpecs) };
    }

    protected _applyConfig(config: PlaceModuleConfig | undefined) {
        if (config?.iconConfig || config?.textConfig) {
            this.updateLayersAndData(config);
        } else if (config?.extraFeatureProps) {
            this.updateData(config);
        }
        return config;
    }

    protected restoreDataAndConfig() {
        const previousShownFeatures = this.sourcesWithLayers.places.shownFeatures;
        this.initSourcesWithLayers(this.config, true);
        this.config && this._applyConfig(this.config);
        this.show(previousShownFeatures);
    }

    /**
     * Apply icon configuration on shown features.
     * Other config remains untouched
     * @param iconConfig the icon config to apply
     */
    applyIconConfig(iconConfig: PlaceIconConfig): void {
        const config = {
            ...this.config,
            iconConfig
        };
        this.updateLayersAndData(config);
        this.config = config;
    }

    applyTextConfig(textConfig: PlaceTextConfig): void {
        const config = {
            ...this.config,
            textConfig
        };
        this.updateLayersAndData(config);
        this.config = config;
    }

    private updateLayersAndData(config: PlaceModuleConfig): void {
        const newLayerSpecs = buildPlacesLayerSpecs(config, this.layerIDPrefix, this.mapLibreMap);
        changeLayersProps(newLayerSpecs, this.layerSpecs, this.mapLibreMap);
        this.layerSpecs = newLayerSpecs;
        this.updateData(config);
    }

    setExtraFeatureProps(extraFeatureProps: { [key: string]: any }): void {
        const config = {
            ...this.config,
            extraFeatureProps
        };
        this.updateData(config);
        this.config = config;
    }

    private updateData(config: PlaceModuleConfig): void {
        this.sourcesWithLayers.places.source.runtimeSource?.setData(
            preparePlacesForDisplay(this.sourcesWithLayers.places.shownFeatures, this.mapLibreMap, config)
        );
    }

    /**
     * Shows the given places on the map.
     * @param places
     */
    show(places: Places): void {
        this.sourcesWithLayers.places.show(preparePlacesForDisplay(places, this.mapLibreMap, this.config));
    }

    /**
     * Clears the places from the map.
     */
    clear(): void {
        this.sourcesWithLayers.places.clear();
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule<Place<DisplayPlaceProps>>(this.eventsProxy, this.sourcesWithLayers.places);
    }
}
