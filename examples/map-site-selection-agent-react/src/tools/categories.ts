import type { POICategory } from '@tomtom-org/maps-sdk/core';
import { getPOICategories, type POICategoryResult } from '@tomtom-org/maps-sdk/services';

// Every category the terms resolve to, each term's best match first. No filter would return the whole catalog.
const resolve = async (terms: string[]): Promise<POICategoryResult[]> =>
    terms.length ? (await getPOICategories({ filters: terms })).poiCategories : [];

/** Resolve search terms to POI category codes (catalog-ranked). [] when nothing resolves. */
export const resolveCategories = async (terms: string[]): Promise<POICategory[]> => {
    try {
        return (await resolve(terms)).map(({ code }) => code);
    } catch {
        return [];
    }
};

/** Resolve to codes plus their human category names (for `matchedBy` surfacing in panels/chat). */
export const resolveCategoriesWithNames = async (
    terms: string[],
): Promise<{ codes: POICategory[]; names: string[] }> => {
    try {
        const categories = await resolve(terms);
        return { codes: categories.map(({ code }) => code), names: categories.map(({ name }) => name) };
    } catch {
        return { codes: [], names: [] };
    }
};
export type CategoryCandidate = Pick<POICategoryResult, 'code' | 'name' | 'synonyms'>;

// Lower case, accents folded, split on anything but letters and digits: "Café/Pub" gives "cafe", "pub".
export const wordsOf = (text: string): string[] =>
    text
        .normalize('NFD')
        .replaceAll(/\p{M}/gu, '')
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter(Boolean);

// Two words "match" if equal or share a prefix within 2 chars of the shorter one, which tolerates plurals
// ("furniture"≈"furnitures", "transport"≈"transportation"). Min length 3 (lookup is generous).
const wordMatch = (termWord: string, targetWord: string): boolean => {
    if (termWord === targetWord) return true;

    const shorterLength = Math.min(termWord.length, targetWord.length);
    if (shorterLength < 3) return false;

    let i = 0;
    while (i < shorterLength && termWord[i] === targetWord[i]) i++;
    return i >= shorterLength - 2;
};

// GENEROUS fallback used ONLY by lookupCategories (agent-facing): fuzzy word overlap, so natural phrases
// ("furniture store", "DIY / hardware store") that match no category as a whole still surface real
// candidates. This looseness is safe here because the AGENT filters the results: it never feeds the map.
const wordOverlap = (term: string, category: POICategoryResult): number => {
    const termWords = [...new Set(wordsOf(term).filter((word) => word.length >= 3))];
    if (termWords.length === 0) return 0;

    const targetWords = [...new Set([category.name, ...category.synonyms].flatMap(wordsOf))];
    return termWords.filter((termWord) => targetWords.some((targetWord) => wordMatch(termWord, targetWord))).length;
};

// The catalog lists some codes twice ("Car Wash"), so a code keeps its first, strongest entry.
const firstPerCode = (categories: POICategoryResult[]): POICategoryResult[] => {
    const byCode = new Map<POICategory, POICategoryResult>();
    for (const category of categories) {
        if (!byCode.has(category.code)) byCode.set(category.code, category);
    }
    return [...byCode.values()];
};

// The term's ranked name and synonym matches first, then the fuzzy word-overlap candidates.
const candidatesFor = async (term: string, catalog: POICategoryResult[]): Promise<POICategoryResult[]> => {
    const { poiCategories: ranked } = await getPOICategories({ filters: [term] });
    const related = catalog
        .map((category) => ({ category, overlap: wordOverlap(term, category) }))
        .filter(({ overlap }) => overlap > 0)
        .sort((first, second) => second.overlap - first.overlap)
        .map(({ category }) => category);
    return firstPerCode([...ranked, ...related]);
};

/**
 * GENEROUS candidate lookup for the agent (the `lookupCategories` tool): per term, the best-matching
 * real catalog entries (code + name + synonyms), many more than a term resolves to, so the agent
 * can SEE the real options and pick exact codes itself. Handles natural phrases via `wordOverlap`.
 */
export const lookupCategoryCandidates = async (
    terms: string[],
    perTerm = 12,
): Promise<{ term: string; candidates: CategoryCandidate[] }[]> => {
    const lookupTerms = terms.map((term) => term.trim()).filter(Boolean);
    try {
        // The first call loads the catalog; each term's filter then reads the SDK's cached copy.
        const { poiCategories: catalog } = await getPOICategories();
        return await Promise.all(
            lookupTerms.map(async (term) => ({
                term,
                candidates: (await candidatesFor(term, catalog))
                    .slice(0, perTerm)
                    .map(({ code, name, synonyms }) => ({ code, name, synonyms: synonyms.slice(0, 6) })),
            })),
        );
    } catch {
        return lookupTerms.map((term) => ({ term, candidates: [] }));
    }
};
