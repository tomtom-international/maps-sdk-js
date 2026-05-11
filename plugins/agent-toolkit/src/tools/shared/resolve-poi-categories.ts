import { poiCategories as knownPoiCategories, POICategory } from '@tomtom-org/maps-sdk/core';
import { getPOICategoryCodes } from '@tomtom-org/maps-sdk/services';

const knownPoiCategoriesSet = new Set<string>(knownPoiCategories);

/** Outcome of {@link resolvePoiCategories}. @ignore */
export type ResolvedPoiCategories = {
    /** Final search filter — known codes plus codes resolved from natural-language synonyms. */
    resolved: POICategory[] | undefined;
    /** Inputs that matched neither an exact code nor any synonym. */
    unresolved: string[];
};

/**
 * Resolve a mixed list of POI inputs to canonical {@link POICategory} codes.
 *
 * Each input is either an exact catalog code (kept as-is) or a natural-language term that is
 * resolved via the POI categories service. Inputs that produce zero matches are reported in
 * `unresolved` so callers can surface a precise error.
 *
 * @ignore
 */
export const resolvePoiCategories = async (poiCategories: string[] | undefined): Promise<ResolvedPoiCategories> => {
    if (!poiCategories) {
        return { resolved: undefined, unresolved: [] };
    }
    const known = poiCategories.filter((c) => knownPoiCategoriesSet.has(c)) as POICategory[];
    const unrecognized = poiCategories.filter((c) => !knownPoiCategoriesSet.has(c));

    if (unrecognized.length === 0) {
        return { resolved: known.length ? known : undefined, unresolved: [] };
    }

    // Pre-warm the SDK's in-memory POI-categories cache once. After this, every per-term
    // `getPOICategoryCodes({ filters: [term] })` below is served from memory — they share
    // the cached catalog and filter it locally. Without the warm-up, N concurrent first-time
    // calls would race the network even though only one fetch is needed.
    await getPOICategoryCodes();

    // One filter lookup per term so we can attribute zero-match results back to their input.
    // All cache hits after the warm-up above — no extra network calls.
    const lookups = await Promise.all(
        unrecognized.map(async (term) => ({ term, codes: await getPOICategoryCodes({ filters: [term] }) })),
    );

    const unresolved: string[] = [];
    const resolvedUnrecognized: POICategory[] = [];
    for (const { term, codes } of lookups) {
        if (codes.length === 0) unresolved.push(term);
        else resolvedUnrecognized.push(...codes);
    }

    const merged = [...new Set([...known, ...resolvedUnrecognized])];
    return { resolved: merged.length ? merged : undefined, unresolved };
};
