import { FeatureCollection, GeoJsonProperties, Point } from "geojson";
import { SymbolLayerSpecification } from "maplibre-gl";
import { Geometries } from "@anw/maps-sdk-js/core";
import {
    AbstractMapModule,
    EventsModule,
    GeoJSONSourceWithLayers,
    GEOMETRY_SOURCE_ID,
    GEOMETRY_TITLE_SOURCE_ID,
    mapStyleLayerIDs,
    SymbolLayerSpecWithoutSource,
    ToBeAddedLayerSpec
} from "../shared";
import { GeometryBeforeLayerConfig, GeometriesModuleConfig, GeometryTextConfig } from "./types/GeometriesModuleConfig";
import { TomTomMap } from "../TomTomMap";
import { changeLayerProps, waitUntilMapIsReady } from "../shared/mapUtils";
import {
    buildGeometryLayerSpec,
    buildGeometryTitleLayerSpec,
    prepareGeometryForDisplay,
    prepareTitleForDisplay
} from "./prepareGeometryForDisplay";
import { GEOMETRY_TITLE_LAYER_ID } from "./layers/GeometryLayers";

/**
 * IDs of sources and layers for geometry module.
 */
type GeometrySourcesWithLayers = {
    geometry: GeoJSONSourceWithLayers<Geometries<GeoJsonProperties>>;
    geometryLabel: GeoJSONSourceWithLayers<FeatureCollection<Point>>;
};

/**
 * Geometry data module.
 */
export class GeometriesModule extends AbstractMapModule<GeometrySourcesWithLayers, GeometriesModuleConfig> {
    private titleLayerSpecs!: SymbolLayerSpecWithoutSource;
    private geometryFillLayerSpecs!: SymbolLayerSpecWithoutSource;
    private geometryOutlineLayerSpecs!: SymbolLayerSpecWithoutSource;

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
        super(map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(config?: GeometriesModuleConfig): GeometrySourcesWithLayers {
        const [geometryFillSpec, geometryOutlineSpec] = buildGeometryLayerSpec(config);
        const titleLayerSpec = buildGeometryTitleLayerSpec(GEOMETRY_TITLE_LAYER_ID, config);
        this.titleLayerSpecs = titleLayerSpec;
        this.geometryFillLayerSpecs = geometryFillSpec;
        this.geometryOutlineLayerSpecs = geometryOutlineSpec;

        return {
            geometry: new GeoJSONSourceWithLayers(this.mapLibreMap, GEOMETRY_SOURCE_ID, [
                { ...geometryFillSpec },
                { ...geometryOutlineSpec }
            ]),
            geometryLabel: new GeoJSONSourceWithLayers(this.mapLibreMap, GEOMETRY_TITLE_SOURCE_ID, [
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
        this.moveBeforeLayerID(layerConfig == "top" ? GEOMETRY_TITLE_LAYER_ID : mapStyleLayerIDs[layerConfig]);
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
        const [geometryFillSpec, geometryOutlineSpec] = buildGeometryLayerSpec(config);
        const newTitleLayerSpecs = buildGeometryTitleLayerSpec(GEOMETRY_TITLE_LAYER_ID, config);

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
    protected restoreDataAndConfig() {
        const previousShownFeatures = this.sourcesWithLayers.geometry.shownFeatures;
        this.initSourcesWithLayers();
        this.config && this._applyConfig(this.config);
        this.show(previousShownFeatures);
    }

    /**
     * Shows the given geometries on the map.
     * @param geometries The geometries to display.
     */
    show(geometries: Geometries<GeoJsonProperties>): void {
        const geometry = this.sourcesWithLayers.geometry;
        geometry.show(prepareGeometryForDisplay(geometries, this.config));
        this.sourcesWithLayers.geometryLabel.show(prepareTitleForDisplay(geometry.shownFeatures));
    }

    /**
     * Clears the Geometry from the map.
     */
    clear(): void {
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
