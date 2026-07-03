import type { POICategory } from '@tomtom-org/maps-sdk/core';
import { getPOICategories } from '@tomtom-org/maps-sdk/services';
import { resolvePoiCategories } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

// Category resolution against the FULL POI catalog (getPOICategories, cached), ranked by match
// strength so a term resolves to its canonical categories — not the substring/synonym noise the old
// keyword filter pulled in (e.g. "parking" → RENT_A_CAR_PARKING / TRUCK_STOP). Genuinely-ambiguous
// *concepts* (e.g. "coffee shop") are still disambiguated by the agent via clarifyIntent.

export const MAX_CATEGORY_CODES = 10; // search rejects an over-long categorySet

type Catalog = { code: POICategory; name: string; synonyms: string[] }[];

const normalize = (value: string): string =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

let cachedCatalog: Promise<Catalog> | null = null;
const loadCatalog = (): Promise<Catalog> => {
    cachedCatalog ??= getPOICategories()
        .then((response) =>
            response.poiCategories.map((category) => ({
                code: category.code,
                name: category.name,
                synonyms: (category.synonyms ?? []) as string[],
            })),
        )
        .catch(() => [] as Catalog);
    return cachedCatalog;
};

// Higher = stronger match. Exact code/name beat word matches beat substring; a name where the term is
// a larger share and appears first ranks above one where it's a trailing qualifier — so "parking"
// favours "Parking" / "Parking Garage" over "Rent-a-Car Parking". Strict on purpose: a term that
// doesn't clearly match returns 0 rather than fuzzily dragging in unrelated categories.
const scoreCategory = (term: string, category: Catalog[number]): number => {
    const t = normalize(term);
    if (!t) return 0;
    if (term.trim().toUpperCase() === category.code) return 1000;

    const name = normalize(category.name);
    const nameWords = name.split(' ');
    const synonyms = category.synonyms.map(normalize);

    let base = 0;
    if (name === t) base = 950;
    else if (synonyms.includes(t)) base = 850;
    // HEAD word (term starts the name) is a real match: "Office Equipment", "Sports Shop".
    else if (name.startsWith(`${t} `) || nameWords[0] === t) base = 720;
    else if (synonyms.some((synonym) => synonym.startsWith(`${t} `) || synonym.split(' ')[0] === t)) base = 620;
    // NON-INITIAL word is usually a different concept: "Post Office", "Pawn Shop" — down-ranked as noise.
    else if (nameWords.includes(t)) base = 440;
    else if (synonyms.some((synonym) => synonym.split(' ').includes(t))) base = 380;
    else if (name.includes(t)) base = 280;
    else if (synonyms.some((synonym) => synonym.includes(t))) base = 180;
    if (base === 0) return 0;

    return base + (t.length / Math.max(name.length, 1)) * 40; // term dominates a short name → small bonus
};

// Best categories for one term: keep only the cluster near the top score (0.7×), capped at 3. A
// strong head-word/exact match (e.g. "Office Equipment" for "office") drops the trailing-word noise
// ("Post Office", "Government Office") below the cutoff.
const rankTerm = (term: string, catalog: Catalog): POICategory[] => {
    const scored = catalog
        .map((category) => ({ code: category.code, score: scoreCategory(term, category) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);
    if (scored.length === 0) return [];
    const cutoff = scored[0].score * 0.7;
    return scored
        .filter((entry) => entry.score >= cutoff)
        .slice(0, 3)
        .map((entry) => entry.code);
};

// Resolve terms → codes, round-robin across terms so one term can't crowd out the others, capped.
const resolve = async (terms: string[]): Promise<POICategory[]> => {
    const catalog = await loadCatalog();
    const perTerm = terms
        .map((term) => term.trim())
        .filter(Boolean)
        .map((term) => rankTerm(term, catalog))
        .filter((codes) => codes.length > 0);

    const out: POICategory[] = [];
    const seen = new Set<POICategory>();
    const longest = Math.max(0, ...perTerm.map((list) => list.length));
    for (let rank = 0; rank < longest && out.length < MAX_CATEGORY_CODES; rank++) {
        for (const list of perTerm) {
            const code = list[rank];
            if (code === undefined || seen.has(code)) continue;
            seen.add(code);
            out.push(code);
            if (out.length >= MAX_CATEGORY_CODES) break;
        }
    }
    return out;
};

/** Resolve search terms to POI category codes (catalog-ranked). [] when nothing resolves. */
export const resolveCategories = async (terms: string[]): Promise<POICategory[]> => {
    try {
        return await resolve(terms);
    } catch {
        return [];
    }
};

/** Resolve to codes plus their human category names (for `matchedBy` surfacing in panels/chat). */
export const resolveCategoriesWithNames = async (
    terms: string[],
): Promise<{ codes: POICategory[]; names: string[] }> => {
    try {
        const [{ resolved }, catalog] = await Promise.all([resolvePoiCategories(terms), loadCatalog()]);
        const codes = resolved ?? [];
        const nameByCode = new Map(catalog.map((category) => [category.code, category.name]));
        return { codes, names: codes.map((code) => nameByCode.get(code) ?? code) };
    } catch {
        return { codes: [], names: [] };
    }
};
export type CategoryCandidate = { code: POICategory; name: string; synonyms: string[] };

// Two words "match" if equal or share a prefix within 2 chars of the shorter one — tolerates plurals
// ("furniture"≈"furnitures", "transport"≈"transportation"). Min length 3 (lookup is generous).
const wordMatch = (a: string, b: string): boolean => {
    if (a === b) return true;
    const min = Math.min(a.length, b.length);
    if (min < 3) return false;
    let i = 0;
    while (i < min && a[i] === b[i]) i++;
    return i >= min - 2;
};

// GENEROUS scoring used ONLY by lookupCategories (agent-facing). Strict tiers rank top; if the term
// matches nothing as a whole, fall back to fuzzy word-overlap so natural phrases ("furniture store",
// "DIY / hardware store") still surface real candidates for the agent to choose from. This looseness
// is safe here because the AGENT filters the results — it never feeds the map (tools stay strict).
const lookupScore = (term: string, category: Catalog[number]): number => {
    const strict = scoreCategory(term, category);
    if (strict > 0) return 1000 + strict;
    const termWords = [
        ...new Set(
            normalize(term)
                .split(' ')
                .filter((w) => w.length >= 3),
        ),
    ];
    if (termWords.length === 0) return 0;
    const target = [
        ...new Set([
            ...normalize(category.name).split(' '),
            ...category.synonyms.flatMap((synonym) => normalize(synonym).split(' ')),
        ]),
    ];
    return termWords.filter((w) => target.some((x) => wordMatch(w, x))).length; // 0..n, below strict
};

/**
 * GENEROUS candidate lookup for the agent (the `lookupCategories` tool): per term, the best-matching
 * real catalog entries (code + name + synonyms) — many more than `rankTerm`'s tight 3, so the agent
 * can SEE the real options and pick exact codes itself. Handles natural phrases via `lookupScore`.
 */
export const lookupCategoryCandidates = async (
    terms: string[],
    perTerm = 12,
): Promise<{ term: string; candidates: CategoryCandidate[] }[]> => {
    const catalog = await loadCatalog();
    return terms
        .map((term) => term.trim())
        .filter(Boolean)
        .map((term) => {
            const candidates = catalog
                .map((category) => ({ category, score: lookupScore(term, category) }))
                .filter((entry) => entry.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, perTerm)
                .map(({ category }) => ({
                    code: category.code,
                    name: category.name,
                    synonyms: category.synonyms.slice(0, 6),
                }));
            return { term, candidates };
        });
};
