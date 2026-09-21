import type { ExpressionFilterSpecification, FilterSpecification, Map as MapLibreMap } from 'maplibre-gl';
import type { TomTomMap } from '../../TomTomMap';
import { toExpressionFilter } from '../mapLibreFilterUtils';

/**
 * A rewrite of the filter a style gave one of its layers: the whole filter in, the whole filter out.
 * @ignore
 */
export type LayerFilterTransform = (filter: unknown) => unknown;

// Everything that has a say in one layer's filter, next to the filter the style itself gave it.
type LayerFilterContributions = {
    styleFilter: unknown;
    transforms: Map<string, LayerFilterTransform>;
    clauses: Map<string, ExpressionFilterSpecification>;
};

const composersByMap = new WeakMap<TomTomMap, LayerFilterComposer>();

// A map entry per contributor, dropped when that contributor withdraws its say.
const setOrDelete = <VALUE>(entries: Map<string, VALUE>, contributor: string, value: VALUE | undefined): void => {
    if (value === undefined) {
        entries.delete(contributor);
        return;
    }
    entries.set(contributor, value);
};

// The transformed filter, narrowed by every clause. The base is converted to expression syntax
// before the clauses join it: MapLibre rejects a filter that mixes the deprecated syntax with the
// expression syntax, and the style's own filter may still use the deprecated one.
const composeFilter = (base: unknown, clauses: ExpressionFilterSpecification[]): FilterSpecification | undefined => {
    if (!clauses.length) return base as FilterSpecification | undefined;

    const terms =
        base === undefined || base === null ? clauses : [...clauses, toExpressionFilter(base as FilterSpecification)];
    return (terms.length === 1 ? terms[0] : ['all', ...terms]) as FilterSpecification;
};

/**
 * The single owner of a style layer's `filter`.
 *
 * Several modules narrow the same layer: {@link POIsModule.filterCategories} adds a category clause
 * to the POI layer, and the styling knob `pois.zoomShift` rewrites the density term inside that same
 * layer's filter. Each rebuilding the filter from its own snapshot of the style means whichever
 * writes last drops the other's work, with nothing to show that it happened.
 *
 * So no module writes a style layer's filter itself. Each registers what it wants under a key of its
 * own, and the composer writes the one filter that carries all of it: the filter the style shipped,
 * run through every **transform**, then narrowed by every **clause**.
 *
 * The snapshot and the contributions belong to the style they were taken from, so both are dropped
 * when a new style arrives; every module re-registers what it still wants as it restores itself.
 *
 * @ignore
 */
export class LayerFilterComposer {
    private readonly mapLibreMap: MapLibreMap;
    private readonly byLayer = new Map<string, LayerFilterContributions>();

    private constructor(tomtomMap: TomTomMap) {
        this.mapLibreMap = tomtomMap.mapLibreMap;
        tomtomMap.addStyleChangeHandler({
            onStyleAboutToChange: () => this.byLayer.clear(),
            // Ahead of every module's own handler, so the clear can never wipe a contribution a
            // module has already made for the style that is arriving.
            priority: Number.NEGATIVE_INFINITY,
        });
    }

    /**
     * The composer of this map, created on first use. One per map: it is the shared state the
     * contributors write through.
     */
    static for(tomtomMap: TomTomMap): LayerFilterComposer {
        let composer = composersByMap.get(tomtomMap);
        if (!composer) {
            composer = new LayerFilterComposer(tomtomMap);
            composersByMap.set(tomtomMap, composer);
        }
        return composer;
    }

    /**
     * Registers a rewrite of the filter the style gave this layer, replacing the one this
     * contributor registered before. Pass `undefined` to withdraw it and leave the filter to
     * the other contributors.
     *
     * @param layerId - The style layer whose filter is rewritten.
     * @param contributor - A key unique to the contributor, e.g. `'styling.zoomShift'`.
     * @param transform - Receives the style's own filter, returns the filter to use instead.
     */
    setTransform(layerId: string, contributor: string, transform: LayerFilterTransform | undefined): void {
        this.contribute(layerId, ({ transforms }) => setOrDelete(transforms, contributor, transform));
    }

    /**
     * Registers a clause that narrows this layer further, `and`-ed with the style's own filter and
     * with every other contributor's clause. Pass `undefined` to withdraw it.
     *
     * @param layerId - The style layer to narrow.
     * @param contributor - A key unique to the contributor, e.g. `'pois.categories'`.
     * @param clause - The clause to add, in expression syntax.
     */
    setClause(layerId: string, contributor: string, clause: ExpressionFilterSpecification | undefined): void {
        this.contribute(layerId, ({ clauses }) => setOrDelete(clauses, contributor, clause));
    }

    // Records one contribution and writes the filter it composes into. A layer the loaded style does
    // not have is left alone: there is no filter to snapshot, and MapLibre has nothing to set it on.
    private contribute(layerId: string, register: (contributions: LayerFilterContributions) => void): void {
        if (!this.mapLibreMap.getLayer(layerId)) return;

        let contributions = this.byLayer.get(layerId);
        if (!contributions) {
            contributions = {
                styleFilter: this.mapLibreMap.getFilter(layerId),
                transforms: new Map(),
                clauses: new Map(),
            };
            this.byLayer.set(layerId, contributions);
        }
        register(contributions);
        this.apply(layerId, contributions);
    }

    private apply(layerId: string, contributions: LayerFilterContributions): void {
        const base = [...contributions.transforms.values()].reduce(
            (filter, transform) => transform(filter),
            contributions.styleFilter,
        );
        const filter = composeFilter(base, [...contributions.clauses.values()]);
        this.mapLibreMap.setFilter(layerId, filter ?? null, { validate: false });
    }
}
