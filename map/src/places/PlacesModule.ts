import type { Place, Places } from '@anw/maps-sdk-js/core';
import type {
    CleanEventStateOptions,
    CleanEventStatesOptions,
    PutEventStateOptions,
    SymbolLayerSpecWithoutSource,
} from '../shared';
import { AbstractMapModule, EventsModule, GeoJSONSourceWithLayers, PLACES_SOURCE_PREFIX_ID } from '../shared';
import { changeLayersProps, waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import { buildPlacesLayerSpecs } from './layers/placesLayers';
import { preparePlacesForDisplay } from './preparePlacesForDisplay';
import type { DisplayPlaceProps } from './types/placeDisplayProps';
import type { PlaceIconConfig, PlacesModuleConfig, PlaceTextConfig } from './types/placesModuleConfig';

/**
 * IDs of sources and layers for places module.
 */
type PlacesSourcesAndLayers = {
    /**
     * Places source id with corresponding layers ids.
     */
    places: GeoJSONSourceWithLayers<Places<DisplayPlaceProps>>;
};

export class PlacesModule extends AbstractMapModule<PlacesSourcesAndLayers, PlacesModuleConfig> {
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
    static async init(tomtomMap: TomTomMap, config?: PlacesModuleConfig): Promise<PlacesModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new PlacesModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: PlacesModuleConfig) {
        super('geojson', map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(config?: PlacesModuleConfig, restore?: boolean): PlacesSourcesAndLayers {
        if (!restore) {
            PlacesModule.lastInstanceIndex++;
            this.sourceID = `${PLACES_SOURCE_PREFIX_ID}-${PlacesModule.lastInstanceIndex}`;
            this.layerIDPrefix = `placesSymbols-${PlacesModule.lastInstanceIndex}`;
        }
        const layerSpecs = buildPlacesLayerSpecs(config, this.layerIDPrefix, this.mapLibreMap);
        this.layerSpecs = layerSpecs;
        return { places: new GeoJSONSourceWithLayers(this.mapLibreMap, this.sourceID, layerSpecs) };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: PlacesModuleConfig | undefined) {
        if (config?.iconConfig || config?.textConfig) {
            this.updateLayersAndData(config);
        } else if (config?.extraFeatureProps) {
            this.updateData(config);
        }
        return config;
    }

    /**
     * @ignore
     */
    protected restoreDataAndConfigImpl() {
        const previousShownFeatures = this.sourcesWithLayers.places.shownFeatures;
        this.initSourcesWithLayers(this.config, true);
        this.config && this._applyConfig(this.config);
        this.show(previousShownFeatures);
    }

    /**
     * Apply icon configuration on shown features.
     * Other config properties remain untouched
     * @param iconConfig the icon config to apply
     */
    applyIconConfig(iconConfig: PlaceIconConfig): void {
        const config = { ...this.config, iconConfig };
        this.updateLayersAndData(config);
        this.config = config;
    }

    applyTextConfig(textConfig: PlaceTextConfig): void {
        const config = { ...this.config, textConfig };
        this.updateLayersAndData(config);
        this.config = config;
    }

    private updateLayersAndData(config: PlacesModuleConfig): void {
        const newLayerSpecs = buildPlacesLayerSpecs(config, this.layerIDPrefix, this.mapLibreMap);
        changeLayersProps(newLayerSpecs, this.layerSpecs, this.mapLibreMap);
        this.layerSpecs = newLayerSpecs;
        this.updateData(config);
    }

    setExtraFeatureProps(extraFeatureProps: { [key: string]: any }): void {
        const config = { ...this.config, extraFeatureProps };
        this.updateData(config);
        this.config = config;
    }

    private updateData(config: PlacesModuleConfig): void {
        this.sourcesWithLayers.places.source.runtimeSource?.setData(
            preparePlacesForDisplay(this.sourcesWithLayers.places.shownFeatures, this.mapLibreMap, config),
        );
    }

    /**
     * Shows the given places on the map.
     * @param places
     */
    async show(places: Place | Place[] | Places) {
        await this.waitUntilModuleReady();
        this.sourcesWithLayers.places.show(preparePlacesForDisplay(places, this.mapLibreMap, this.config));
    }

    /**
     * Clears the places from the map.
     */
    async clear() {
        await this.waitUntilModuleReady();
        this.sourcesWithLayers.places.clear();
    }

    /**
     * Puts the given event state to the given place.
     * * Use this to programmatically make places appear hovered or clicked.
     * @param options The options to put the event state.
     */
    putEventState(options: PutEventStateOptions) {
        this.sourcesWithLayers.places.putEventState(options);
    }

    /**
     * Cleans any event state from the given place.
     * * Use this to programmatically remove a hovered or clicked appearance from a place.
     * @param options The options to clean the event state.
     */
    cleanEventState(options: CleanEventStateOptions): void {
        this.sourcesWithLayers.places.cleanEventState(options);
    }

    /**
     * Cleans some or all the event states from these shown places.
     * * Use this to programmatically remove hovered or clicked appearances from places.
     * @param options The options to clean the event states.
     */
    cleanEventStates(options?: CleanEventStatesOptions) {
        this.sourcesWithLayers.places.cleanEventStates(options);
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule<Place<DisplayPlaceProps>>(this.eventsProxy, this.sourcesWithLayers.places);
    }
}
