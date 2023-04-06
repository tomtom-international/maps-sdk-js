import { FeatureCollection, GeoJsonProperties, Point } from "geojson";
import { SymbolLayerSpecification } from "maplibre-gl";
import { Geometries } from "@anw/maps-sdk-js/core";
import {
    AbstractMapModule,
    EventsModule,
    GeoJSONSourceWithLayers,
    GEOMETRY_SOURCE_ID,
    GEOMETRY_TITLE_SOURCE_ID,
    SymbolLayerSpecWithoutSource,
    ToBeAddedLayerSpec
} from "../shared";
import {
    GeometryLayerPositionConfig,
    GeometryLayerPositionOptions,
    GeometryModuleConfig,
    GeometryTextConfig
} from "./types/GeometryModuleConfig";
import { TomTomMap } from "../TomTomMap";
import { changeLayoutAndPaintProps, waitUntilMapIsReady } from "../shared/mapUtils";
import {
    buildGeometryLayerSpec,
    buildGeometryTitleLayerSpec,
    prepareGeometryForDisplay,
    prepareTitleForDisplay
} from "./prepareGeometryForDisplay";
import { GEOMETRY_FILL_LAYER_ID, GEOMETRY_OUTLINE_LAYER_ID, GEOMETRY_TITLE_LAYER_ID } from "./layers/GeometryLayers";

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
export class GeometryModule extends AbstractMapModule<GeometrySourcesWithLayers, GeometryModuleConfig> {
    private titleLayerSpecs!: SymbolLayerSpecWithoutSource;
    private geometryFillLayerSpecs!: SymbolLayerSpecWithoutSource;
    private geometryOutlineLayerSpecs!: SymbolLayerSpecWithoutSource;

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(tomtomMap: TomTomMap, config?: GeometryModuleConfig): Promise<GeometryModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new GeometryModule(tomtomMap, config);
    }

    protected _initSourcesWithLayers(config?: GeometryModuleConfig): GeometrySourcesWithLayers {
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

    protected _applyConfig(config: GeometryModuleConfig | undefined) {
        if (config?.textConfig || config?.colorConfig || config?.lineConfig) {
            this.updateLayerAndData(config);
        }

        if (config?.layerPosition) {
            this.applyLayerPositionConfig(config.layerPosition);
        }
    }

    private _updateLayerPosition(beforeLayerId?: string) {
        this.sourcesWithLayers.geometry.sourceAndLayerIDs.layerIDs.forEach((layer) => {
            this.mapLibreMap.moveLayer(layer, beforeLayerId);
        });
    }

    applyLayerPositionConfig(layerPosition: GeometryLayerPositionConfig) {
        this.config = { ...this.config, layerPosition };

        if (layerPosition === "belowStraightLabels") {
            const layer = this.mapLibreMap
                .getStyle()
                .layers.find((layer) => layer.type === "symbol" && layer.layout?.["symbol-placement"] === "point");
            if (layer?.id) {
                this._updateLayerPosition(layer?.id);
            }
        } else {
            this._updateLayerPosition(GeometryLayerPositionOptions[layerPosition]);
        }
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

    private updateLayerAndData(config: GeometryModuleConfig) {
        const [geometryFillSpec, geometryOutlineSpec] = buildGeometryLayerSpec(config);
        const newTitleLayerSpecs = buildGeometryTitleLayerSpec(GEOMETRY_TITLE_LAYER_ID, config);

        changeLayoutAndPaintProps(geometryFillSpec, this.geometryFillLayerSpecs, this.mapLibreMap);
        changeLayoutAndPaintProps(geometryOutlineSpec, this.geometryOutlineLayerSpecs, this.mapLibreMap);
        changeLayoutAndPaintProps(newTitleLayerSpecs, this.titleLayerSpecs, this.mapLibreMap);

        this.geometryFillLayerSpecs = geometryFillSpec;
        this.geometryOutlineLayerSpecs = geometryOutlineSpec;
        this.titleLayerSpecs = newTitleLayerSpecs;
    }

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
