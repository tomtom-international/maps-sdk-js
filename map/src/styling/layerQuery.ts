import { isEqual } from 'lodash-es';
import type {
    AllLayoutProperties,
    AllPaintProperties,
    FilterSpecification,
    LayerSpecification,
    Map as MapLibreMap,
    StyleSetterOptions,
} from 'maplibre-gl';
import { baseMapLayerGroupSelector } from '../base/layerGroups';
import type { BaseMapLayerGroupName } from '../base/types/baseMapModuleConfig';
import type { LayerFilterComposer } from '../shared/layers/layerFilterComposer';
import { type LayerSelector, matchesLayerSelector, type StyleSources } from '../shared/layers/layerSelector';

/**
 * How {@link StylingModule.layers} picks style layers: by the SDK's base-map group taxonomy, layer
 * type, vector-tile source layer and case-insensitive id fragments. Every constraint given must hold.
 *
 * @group Map Styling
 */
export type LayerQuery = {
    /** A base-map layer group, the same vocabulary as {@link BaseMapModule}. */
    group?: BaseMapLayerGroupName;
    /** The style's own `metadata.group` values, for groups the SDK does not name. */
    metadataGroups?: string[];
    /** Layer types (`line`, `fill`, `symbol`, …). */
    layerTypes?: LayerSpecification['type'][];
    /** Vector-tile source layers (`roads`, `places`, `poi`, …). */
    sourceLayers?: string[];
    /** The layer id must contain one of these (case-insensitive). */
    idIncludes?: string[];
    /** The layer id must contain none of these (case-insensitive). */
    idExcludes?: string[];
};

/**
 * MapLibre types each property accessor against the literal name it is given, a pairing a name picked
 * at runtime cannot express. The styling module reads and writes through this view of the same
 * methods, with values that are the style's own or an expression wrapped around them.
 * @ignore
 */
export type RuntimeLayerProperties = {
    getLayoutProperty(layerId: string, property: string): unknown;
    getPaintProperty(layerId: string, property: string): unknown;
    setLayoutProperty(layerId: string, property: string, value: unknown, options: StyleSetterOptions): unknown;
    setPaintProperty(layerId: string, property: string, value: unknown, options: StyleSetterOptions): unknown;
};

// The raw layer edits' key with the shared filter composer.
const LAYER_EDITS_CONTRIBUTOR = 'styling.layers';

// A raw paint or layout override on a set of layers.
type PropertyOverride = { kind: 'paint' | 'layout'; property: string; value: unknown };
// An override on one layer, with the value it replaced there.
type OverrideEntry = { override: PropertyOverride; before: unknown };

/**
 * The advanced tier of the styling module: raw MapLibre paint, layout and filter edits over a
 * query of style layers, re-applied across style switches.
 *
 * @remarks
 * **This is the version-coupled tier.** Layer ids, expressions and even which layers exist belong to
 * the loaded style version, so an edit may match nothing on the next one: the selection is then empty
 * and the SDK warns once. Prefer a knob or {@link StylingModule.setMapColors} where one fits.
 *
 * Overrides are not part of `getConfig()`: they are edits to this style, not portable settings.
 *
 * @example
 * ```typescript
 * styling.layers.query({ group: 'roadLabels' }).setPaint({ 'text-color': '#93c5fd' });
 * styling.layers.query({ metadataGroups: ['water'], layerTypes: ['fill'] }).setPaint({ 'fill-opacity': 0.6 });
 * styling.layers.query({ idIncludes: ['railway'] }).setVisible(false);
 * styling.layers.query({ group: 'roadLabels' }).reset();
 * ```
 *
 * @group Map Styling
 */
export class LayerSelection {
    /**
     * @ignore
     */
    constructor(
        private readonly registry: LayerOverrides,
        readonly query: LayerQuery,
    ) {}

    /**
     * The ids of the layers the query matches in the loaded style, in draw order. Empty when the
     * style has no such layers.
     */
    get layerIds(): string[] {
        return this.registry.resolve(this.query);
    }

    /** Sets paint properties on every matched layer. */
    setPaint(paint: Partial<AllPaintProperties>): this {
        for (const [property, value] of Object.entries(paint))
            this.registry.override(this.query, { kind: 'paint', property, value });
        return this;
    }

    /** Sets layout properties on every matched layer. */
    setLayout(layout: Partial<AllLayoutProperties>): this {
        for (const [property, value] of Object.entries(layout))
            this.registry.override(this.query, { kind: 'layout', property, value });
        return this;
    }

    /**
     * Replaces the filter the style gave every matched layer. The filters other modules add, such as
     * POI categories and traffic filters, still narrow it.
     */
    setFilter(filter: FilterSpecification | undefined): this {
        this.registry.overrideFilter(this.query, filter);
        return this;
    }

    /** Shows or hides every matched layer. */
    setVisible(visible: boolean): this {
        return this.setLayout({ visibility: visible ? 'visible' : 'none' });
    }

    /** Removes every override made through the styling module on the matched layers. */
    reset(): this {
        this.registry.reset(this.query);
        return this;
    }
}

/**
 * The styling module's registry of raw layer overrides: resolves queries against the loaded style,
 * applies overrides, remembers what each property was before, and re-applies after a style switch.
 * Filters go through the map's {@link LayerFilterComposer}, which holds the style's own filter.
 * @ignore
 */
export class LayerOverrides {
    private layers: LayerSpecification[] = [];
    private sources: StyleSources = {};
    // Per layer id, per property.
    private readonly properties = new Map<string, Map<string, OverrideEntry>>();
    // Per layer id: the filter that replaces the style's own.
    private readonly filters = new Map<string, FilterSpecification | undefined>();

    constructor(
        private readonly mapLibreMap: MapLibreMap,
        private readonly filterComposer: LayerFilterComposer,
        private readonly warn: (key: string, message: string) => void,
    ) {}

    /** Points the registry at a freshly loaded style; overrides are kept and re-applied by {@link reapply}. */
    index(layers: LayerSpecification[], sources: StyleSources): void {
        this.layers = layers;
        this.sources = sources;
    }

    /** Forgets every override (a clean style switch, which also clears the filter composer). */
    clear(): void {
        this.properties.clear();
        this.filters.clear();
    }

    resolve(query: LayerQuery): string[] {
        const selectors = selectorsOf(query);
        const ids = this.layers
            .filter((layer) => selectors.every((selector) => matchesLayerSelector(selector, layer, this.sources)))
            .map((layer) => layer.id);
        if (ids.length === 0) {
            this.warn(
                `query:${JSON.stringify(query)}`,
                `layers.query(${JSON.stringify(query)}) matches no layer in the loaded style; the edit will have no effect.`,
            );
        }
        return ids;
    }

    override(query: LayerQuery, override: PropertyOverride): void {
        const key = `${override.kind}:${override.property}`;
        for (const layerId of this.resolve(query)) {
            const perLayer = this.properties.get(layerId) ?? new Map<string, OverrideEntry>();
            const existing = perLayer.get(key);
            perLayer.set(key, { override, before: existing ? existing.before : this.read(layerId, override) });
            this.properties.set(layerId, perLayer);
            this.write(layerId, override);
        }
    }

    overrideFilter(query: LayerQuery, filter: FilterSpecification | undefined): void {
        for (const layerId of this.resolve(query)) {
            this.filters.set(layerId, filter);
            this.filterComposer.setTransform(layerId, LAYER_EDITS_CONTRIBUTOR, () => filter);
        }
    }

    reset(query: LayerQuery): void {
        for (const layerId of this.resolve(query)) {
            for (const { override, before } of this.properties.get(layerId)?.values() ?? []) {
                this.write(layerId, { ...override, value: before });
            }
            this.properties.delete(layerId);
            if (this.filters.delete(layerId)) {
                this.filterComposer.setTransform(layerId, LAYER_EDITS_CONTRIBUTOR, undefined);
            }
        }
    }

    /**
     * Lands every override again on top of the current style. What an override replaces is re-read
     * only where something else wrote under it since (a new style, or a knob on the same property);
     * a layer still carrying the override keeps the value it replaced.
     */
    reapply(): void {
        for (const [layerId, perLayer] of this.properties) {
            if (!this.mapLibreMap.getLayer(layerId)) continue;

            for (const entry of perLayer.values()) {
                const current = this.read(layerId, entry.override);
                if (!isEqual(current, entry.override.value)) entry.before = current;
                this.write(layerId, entry.override);
            }
        }
        for (const [layerId, filter] of this.filters) {
            this.filterComposer.setTransform(layerId, LAYER_EDITS_CONTRIBUTOR, () => filter);
        }
    }

    private read(layerId: string, { kind, property }: PropertyOverride): unknown {
        const properties: RuntimeLayerProperties = this.mapLibreMap;
        return kind === 'paint'
            ? properties.getPaintProperty(layerId, property)
            : properties.getLayoutProperty(layerId, property);
    }

    private write(layerId: string, { kind, property, value }: PropertyOverride): void {
        if (!this.mapLibreMap.getLayer(layerId)) return;

        const properties: RuntimeLayerProperties = this.mapLibreMap;
        const options = { validate: false };
        if (kind === 'paint') {
            properties.setPaintProperty(layerId, property, value, options);
        } else {
            properties.setLayoutProperty(layerId, property, value, options);
        }
    }
}

// Both selectors must hold, so the query narrows the group — never replaces or widens its constraints.
const selectorsOf = ({ group, ...selector }: LayerQuery): LayerSelector[] => [
    selector,
    ...(group ? [baseMapLayerGroupSelector(group)] : []),
];
