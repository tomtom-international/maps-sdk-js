import isNil from "lodash/isNil";
import { Places, Place } from "@anw/go-sdk-js/core";
import {
    AbstractMapModule,
    EventsModule,
    GeoJSONSourceWithLayers,
    PLACES_SOURCE_ID,
    ToBeAddedLayerSpec
} from "../shared";
import { waitUntilMapIsReady } from "../shared/mapUtils";
import { PlaceIconConfig, PlaceModuleConfig, PlaceTextConfig } from "./types/PlaceModuleConfig";
import { GOSDKMap } from "../GOSDKMap";
import { SymbolLayerSpecification } from "maplibre-gl";
import { changeLayoutAndPaintProps, getPlacesLayerSpec, preparePlacesForDisplay } from "./preparePlacesForDisplay";

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
        const layerSpec = getPlacesLayerSpec(config, this.mapLibreMap);
        this.places = new GeoJSONSourceWithLayers(this.mapLibreMap, PLACES_SOURCE_ID, [
            layerSpec as ToBeAddedLayerSpec<SymbolLayerSpecification>
        ]);
        this.layerSpec = layerSpec;
        this._addModuleToEventsProxy(true);
    }

    protected _applyConfig(config: PlaceModuleConfig | undefined) {
        if (config?.iconConfig || config?.textConfig) {
            this.updateLayerSpecsAndData(config);
        } else if (config?.extraFeatureProps) {
            this.updateSourceData(config);
        }

        if (config && !isNil(config.interactive)) {
            this._addModuleToEventsProxy(config.interactive);
        }
    }

    private _addModuleToEventsProxy(interactive: boolean) {
        this.goSDKMap._eventsProxy.ensureAdded(this.places, interactive);
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
        this.updateLayerSpecsAndData(config);
        this.config = config;
    }

    applyTextConfig(textConfig: PlaceTextConfig): void {
        const config = {
            ...this.config,
            textConfig
        };
        this.updateLayerSpecsAndData(config);
        this.config = config;
    }

    private updateLayerSpecsAndData(config: PlaceModuleConfig): void {
        const newLayerSpec = getPlacesLayerSpec(config, this.mapLibreMap);
        changeLayoutAndPaintProps(newLayerSpec, this.layerSpec, this.mapLibreMap);
        this.layerSpec = newLayerSpec;
        this.updateSourceData(config);
    }

    setExtraFeatureProps(extraFeatureProps: { [key: string]: any }): void {
        const config = {
            ...this.config,
            extraFeatureProps
        };
        this.updateSourceData(config);
        this.config = config;
    }

    private updateSourceData(config: PlaceModuleConfig): void {
        this.places.source.runtimeSource?.setData(
            preparePlacesForDisplay(this.places.shownFeatures, this.mapLibreMap, config)
        );
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
