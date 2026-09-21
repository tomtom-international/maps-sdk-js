import type { LayerSpecification, MapGeoJSONFeature } from 'maplibre-gl';
import type { LayerSpecFilter, SourceWithLayers } from './types';

/**
 * What `where()` accepts: a predicate over the feature type this surface exposes, or — where the
 * module defines one — its own scope object. {@link UserEvents.where} turns either into a
 * {@link ResolvedEventScope}.
 *
 * @typeParam T - Feature type this surface exposes, which a predicate therefore receives.
 * @typeParam WHERE_SCOPE - The module's own scope object, such as {@link BaseMapEventScope}.
 *   `never` on a module that only supports predicates, leaving just the predicate arm.
 *
 * @ignore
 */
export type EventScope<T, WHERE_SCOPE> = ((feature: T) => boolean) | WHERE_SCOPE;

/**
 * A scope narrowed down to the two things the event proxy can act on.
 *
 * Every public way of expressing a scope — a feature predicate, `{ layerGroups }` on
 * {@link BaseMapModule}, a module's named scope — resolves to one of these before it reaches
 * {@link AbstractEventProxy}. Both parts are optional: an unscoped handler carries neither.
 *
 * @ignore
 */
export type ResolvedEventScope = {
    /**
     * Selects which of the source's layers the handler listens to. Applied fresh whenever the
     * layer set changes, so a scope keeps meaning the same thing across style changes.
     */
    layerFilter?: LayerSpecFilter;
    /**
     * Decides whether a rendered feature belongs to this scope. Receives the raw MapLibre
     * feature — a module's `mapping` is composed into this function at `where()` time, so the
     * caller's predicate still sees the module's own feature type.
     */
    featureMatches?: (feature: MapGeoJSONFeature) => boolean;
};

// ANDs two optional predicates, returning undefined only when neither is set, so an unscoped
// registration stays genuinely unscoped rather than paying for an always-true call.
const andPredicates = <A extends unknown[]>(
    outer: ((...args: A) => boolean) | undefined,
    inner: ((...args: A) => boolean) | undefined,
): ((...args: A) => boolean) | undefined => {
    if (!outer) return inner;
    if (!inner) return outer;

    return (...args: A) => outer(...args) && inner(...args);
};

/**
 * Combines an existing scope with a narrower one, so `where(a).where(b)` means "a and b".
 * Both axes intersect independently.
 *
 * Chaining is not a feature to reach for — two predicates read better as one `a(f) && b(f)`, and
 * layer plus feature narrowing is a single {@link BaseMapEventScope}. It exists because `where()`
 * returns a `UserEvents`, which has a `where()` of its own: without intersecting here, a second
 * call would silently replace the first and *widen* the scope.
 * @ignore
 */
export const combineEventScopes = (
    outer: ResolvedEventScope | undefined,
    inner: ResolvedEventScope | undefined,
): ResolvedEventScope | undefined => {
    if (!outer) return inner;
    if (!inner) return outer;

    const layerFilter = andPredicates<[LayerSpecification]>(outer.layerFilter, inner.layerFilter);
    const featureMatches = andPredicates<[MapGeoJSONFeature]>(outer.featureMatches, inner.featureMatches);
    return layerFilter || featureMatches ? { layerFilter, featureMatches } : undefined;
};

/**
 * The layer specs a scope selects out of a source, resolved against the source's *current*
 * layers. Called again on every style change so a scope never holds stale layer IDs.
 * @ignore
 */
export const scopedLayerSpecs = (
    sourceWithLayers: SourceWithLayers,
    scope: ResolvedEventScope | undefined,
): LayerSpecification[] =>
    scope?.layerFilter ? sourceWithLayers._layerSpecs.filter(scope.layerFilter) : sourceWithLayers._layerSpecs;

/**
 * Names a module cannot use for a named event scope, because a scope is attached as a property
 * onto the module-wide events object and would shadow one of its methods.
 * @ignore
 */
export const reservedScopeNames: readonly string[] = ['on', 'off', 'where'];

/**
 * Guards {@link reservedScopeNames}. SDK-authored scope names are covered by a unit test, but
 * {@link CustomGeoJSONModule} takes its scope names from the caller's own `sources`, so this
 * has to hold at runtime too.
 * @ignore
 */
export const assertNoReservedScopeNames = (names: string[], context: string): void => {
    const offender = names.find((name) => reservedScopeNames.includes(name));
    if (offender) {
        throw new Error(
            `${context} uses the reserved event scope name "${offender}". Reserved: ${reservedScopeNames.join(', ')}.`,
        );
    }
};
