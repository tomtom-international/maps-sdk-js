import { FeatureCollection, Point } from "geojson";
import { SymbolLayerSpecification } from "maplibre-gl";
import { PolygonFeatures } from "@anw/maps-sdk-js/core";
import {
    AbstractMapModule,
    EventsModule,
    GeoJSONSourceWithLayers,
    mapStyleLayerIDs,
    SymbolLayerSpecWithoutSource,
    ToBeAddedLayerSpec
} from "../shared";
import { GeometryBeforeLayerConfig, GeometriesModuleConfig, GeometryTextConfig } from "./types/geometriesModuleConfig";
import { TomTomMap } from "../TomTomMap";
import { changeLayerProps, waitUntilMapIsReady } from "../shared/mapUtils";
import {
    buildGeometryLayerSpecs,
    buildGeometryTitleLayerSpec,
    prepareGeometryForDisplay,
    prepareTitleForDisplay
} from "./prepareGeometryForDisplay";

/**
 * IDs of sources and layers from a geometry module.
 */
type GeometrySourcesWithLayers = {
    geometry: GeoJSONSourceWithLayers<PolygonFeatures>;
    geometryLabel: GeoJSONSourceWithLayers<FeatureCollection<Point>>;
};

/**
 * Geometry data module.
 */
export class GeometriesModule extends AbstractMapModule<GeometrySourcesWithLayers, GeometriesModuleConfig> {
    private static lastInstanceIndex = -1;

    private titleLayerSpecs!: SymbolLayerSpecWithoutSource;
    private geometryFillLayerSpecs!: SymbolLayerSpecWithoutSource;
    private geometryOutlineLayerSpecs!: SymbolLayerSpecWithoutSource;

    private sourceID!: string;
    private fillLayerID!: string;
    private outlineLayerID!: string;

    private titleSourceID!: string;
    private titleLayerID!: string;

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(tomtomMap: TomTomMap, config?: GeometriesModuleConfig): Promise<GeometriesModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new GeometriesModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: GeometriesModuleConfig) {
        super("geojson", map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(config?: GeometriesModuleConfig, restore?: boolean): GeometrySourcesWithLayers {
        if (!restore) {
            GeometriesModule.lastInstanceIndex++;
            this.sourceID = `geometry-${GeometriesModule.lastInstanceIndex}`;
            this.titleSourceID = `geometryTitle-${GeometriesModule.lastInstanceIndex}`;
            const layerIDPrefix = `geometry-${GeometriesModule.lastInstanceIndex}`;
            this.fillLayerID = `${layerIDPrefix}_Fill`;
            this.outlineLayerID = `${layerIDPrefix}_Outline`;
            this.titleLayerID = `${layerIDPrefix}_Title`;
        }

        const [geometryFillSpec, geometryOutlineSpec] = buildGeometryLayerSpecs(
            this.fillLayerID,
            this.outlineLayerID,
            config
        );
        const titleLayerSpec = buildGeometryTitleLayerSpec(this.titleLayerID, config);
        this.titleLayerSpecs = titleLayerSpec;
        this.geometryFillLayerSpecs = geometryFillSpec;
        this.geometryOutlineLayerSpecs = geometryOutlineSpec;

        return {
            geometry: new GeoJSONSourceWithLayers(this.mapLibreMap, this.sourceID, [
                { ...geometryFillSpec },
                { ...geometryOutlineSpec }
            ]),
            geometryLabel: new GeoJSONSourceWithLayers(this.mapLibreMap, this.titleSourceID, [
                titleLayerSpec as ToBeAddedLayerSpec<SymbolLayerSpecification>
            ])
        };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: GeometriesModuleConfig | undefined) {
        if (config?.textConfig || config?.colorConfig || config?.lineConfig) {
            this.updateLayerAndData(config);
        }
        if (config?.beforeLayerConfig) {
            this.moveBeforeLayer(config.beforeLayerConfig);
        }
        return config;
    }

    private moveBeforeLayerID(beforeLayerId?: string) {
        this.sourcesWithLayers.geometry.sourceAndLayerIDs.layerIDs.forEach((layer) =>
            this.mapLibreMap.moveLayer(layer, beforeLayerId)
        );
    }

    moveBeforeLayer(layerConfig: GeometryBeforeLayerConfig) {
        this.config = { ...this.config, beforeLayerConfig: layerConfig };
        this.moveBeforeLayerID(layerConfig == "top" ? this.titleLayerID : mapStyleLayerIDs[layerConfig]);
    }

    /**
     * Applies a new text configuration
     * @param textConfig Geometry text configuration
     */
    applyTextConfig(textConfig: GeometryTextConfig) {
        const config = { ...this.config, textConfig };
        this.updateLayerAndData(config);
        this.sourcesWithLayers.geometryLabel.show(
            prepareTitleForDisplay(this.sourcesWithLayers.geometry.shownFeatures)
        );
        this.config = config;
    }

    private updateLayerAndData(config: GeometriesModuleConfig) {
        const [geometryFillSpec, geometryOutlineSpec] = buildGeometryLayerSpecs(
            this.fillLayerID,
            this.outlineLayerID,
            config
        );
        const newTitleLayerSpecs = buildGeometryTitleLayerSpec(this.titleLayerID, config);

        changeLayerProps(geometryFillSpec, this.geometryFillLayerSpecs, this.mapLibreMap);
        changeLayerProps(geometryOutlineSpec, this.geometryOutlineLayerSpecs, this.mapLibreMap);
        changeLayerProps(newTitleLayerSpecs, this.titleLayerSpecs, this.mapLibreMap);

        this.geometryFillLayerSpecs = geometryFillSpec;
        this.geometryOutlineLayerSpecs = geometryOutlineSpec;
        this.titleLayerSpecs = newTitleLayerSpecs;
    }

    /**
     * @ignore
     */
    protected restoreDataAndConfigImpl() {
        const previousShownFeatures = this.sourcesWithLayers.geometry.shownFeatures;
        this.initSourcesWithLayers(this.config, true);
        this.config && this._applyConfig(this.config);
        this.show(previousShownFeatures);
    }

    /**
     * Shows the given geometries on the map.
     * @param geometries The geometries to display.
     */
    async show(geometries: PolygonFeatures) {
        await this.waitUntilSourcesAndLayersAdded();
        const geometry = this.sourcesWithLayers.geometry;
        geometry.show(prepareGeometryForDisplay(geometries, this.config));
        this.sourcesWithLayers.geometryLabel.show(prepareTitleForDisplay(geometry.shownFeatures));
    }

    /**
     * Clears the Geometry from the map.
     */
    async clear() {
        await this.waitUntilSourcesAndLayersAdded();
        this.sourcesWithLayers.geometry.clear();
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.tomtomMap._eventsProxy, this.sourcesWithLayers.geometry);
    }
}
