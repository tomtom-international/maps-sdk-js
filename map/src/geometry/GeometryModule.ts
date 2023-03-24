import { FeatureCollection, GeoJsonProperties, Point } from "geojson";
import { FillLayerSpecification, LineLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";
import { Geometries } from "@anw/maps-sdk-js/core";
import {
    AbstractMapModule,
    EventsModule,
    GeoJSONSourceWithLayers,
    GEOMETRY_SOURCE_ID,
    SourceWithLayerIDs,
    GEOMETRY_TITLE_SOURCE_ID,
    ToBeAddedLayerSpec
} from "../shared";
import { GeometryModuleConfig, GeometryTextConfig } from "./types/GeometryModuleConfig";
import { TomTomMap } from "../TomTomMap";
import { waitUntilMapIsReady } from "../shared/mapUtils";
import {
    buildGeometryLayerSpec,
    buildGeometryTitleLayerSpec,
    prepareGeometryForDisplay,
    prepareTitleForDisplay
} from "./prepareGeometryForDisplay";

const GEOMETRY_FILL_LAYER_ID = "geometry_Fill";
const GEOMETRY_OUTLINE_LAYER_ID = "geometry_Outline";
const GEOMETRY_TITLE_LAYER_ID = "geometry_Title";

/**
 * IDs of sources and layers for geometry module.
 */
export type GeometryModuleSourcesAndLayersIds = {
    /**
     * Geometry source id with corresponding layers ids.
     */
    geometry: SourceWithLayerIDs;
};

/**
 * Geometry data module.
 */
export class GeometryModule extends AbstractMapModule<GeometryModuleSourcesAndLayersIds, GeometryModuleConfig> {
    private geometry!: GeoJSONSourceWithLayers<Geometries<GeoJsonProperties>>;
    private geometryLabel!: GeoJSONSourceWithLayers<FeatureCollection<Point>>;

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

    protected initSourcesWithLayers(config?: GeometryModuleConfig) {
        const [geometryFillSpec, geometryOutlineSpec] = buildGeometryLayerSpec(config);
        this.geometry = new GeoJSONSourceWithLayers(this.mapLibreMap, GEOMETRY_SOURCE_ID, [
            { ...geometryFillSpec, id: GEOMETRY_FILL_LAYER_ID } as ToBeAddedLayerSpec<FillLayerSpecification>,
            { ...geometryOutlineSpec, id: GEOMETRY_OUTLINE_LAYER_ID } as ToBeAddedLayerSpec<LineLayerSpecification>
        ]);
        const titleLayerSpec = buildGeometryTitleLayerSpec(GEOMETRY_TITLE_LAYER_ID, config);
        this.geometryLabel = new GeoJSONSourceWithLayers(this.mapLibreMap, GEOMETRY_TITLE_SOURCE_ID, [
            titleLayerSpec as ToBeAddedLayerSpec<SymbolLayerSpecification>
        ]);

        return {
            geometry: { sourceID: GEOMETRY_SOURCE_ID, layerIDs: [GEOMETRY_FILL_LAYER_ID, GEOMETRY_OUTLINE_LAYER_ID] }
        };
    }

    protected _applyConfig(config: GeometryModuleConfig | undefined) {
        if (config?.textConfig) {
            this.applyTextConfig(config.textConfig);
        }
    }

    applyTextConfig(textConfig: GeometryTextConfig) {
        if (textConfig?.textField && this.geometry.shownFeatures) {
            const geometryTitleData = prepareTitleForDisplay(this.geometry.shownFeatures);
            this.geometryLabel.show(geometryTitleData);
        }
    }

    /**
     * Shows the given Geometry on the map.
     * @param geometry
     * @param options
     */
    show(geometry: Geometries<GeoJsonProperties>): void {
        this.geometry.show(prepareGeometryForDisplay(geometry, this.config));
        this._applyConfig(this.config);
    }

    /**
     * Clears the Geometry from the map.
     */
    clear(): void {
        this.geometry.clear();
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule(this.tomtomMap._eventsProxy, this.geometry);
    }
}
