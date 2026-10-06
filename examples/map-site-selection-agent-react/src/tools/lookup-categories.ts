import type { ToolEntry } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { z } from 'zod';
import { lookupCategoryCandidates } from './categories';

// Lets the AGENT resolve concepts to real TomTom POI categories, rather than relying only on the
// tool-side fuzzy resolver. The catalog has ~540 categories — too many to dump into context — so this
// returns the generous candidate set per term (code + name + synonyms). The agent reads the real
// options, picks the exact CODES that fit (and any closely-related ones), and passes those codes to
// the analysis tools, where an exact code resolves to itself (no fuzzy mis-match).

const lookupCategoriesSchema = z.object({
    terms: z
        .array(z.string())
        .min(1)
        .max(12)
        .describe('Concepts / keywords to map to TomTom POI categories, e.g. ["gym", "yoga studio", "supermarket"].'),
});

type LookupCategoriesInput = z.infer<typeof lookupCategoriesSchema>;

export const lookupCategories: ToolEntry = {
    description:
        'Map concept terms to the REAL TomTom POI categories, from the full catalog. Returns the best candidates ' +
        '(code + name + synonyms) per term so YOU choose the exact codes — then pass those codes as the category ' +
        'terms to profileSite / rankSites / findWhitespace (an exact code resolves to itself, avoiding fuzzy ' +
        'mis-matches like "office" → Post Office). Use it whenever the right category is not obvious or precision ' +
        'matters (the competitor concept, demand anchors). You may pick several codes and add closely-related ones. ' +
        'If a keyword returns nothing, retry a simpler or synonymous word before giving up, and do not abandon the ' +
        'whole analysis when one term fails — proceed with the categories that resolved.',
    classificationPrompt:
        'A concept, competitor, or demand anchor needs to be mapped to specific TomTom POI categories before a ' +
        'search can run accurately.',
    inputSchema: lookupCategoriesSchema,
    execute: (async (params: LookupCategoriesInput) => {
        const results = await lookupCategoryCandidates(params.terms);
        return {
            results,
            note:
                'Pick the exact codes that fit each term (several is fine; add closely-related categories too), then ' +
                'pass them as the category terms to the analysis tool. If a term returns no candidates, retry this ' +
                'tool with a SIMPLER or synonymous keyword (e.g. "furniture" instead of "furniture store", ' +
                '"childcare" instead of "daycare") before concluding a concept is unsupported. Do not abandon the ' +
                'whole analysis over one unmatched term — proceed with the categories that did resolve.',
        };
    }) as ToolEntry['execute'],
    examplePrompts: [
        'What TomTom categories represent demand for a gym?',
        'Which category should I search for to find competitors to a coffee shop?',
        'Which TomTom categories cover furniture and home-decor stores?',
        'What category code matches pharmacies and chemists?',
    ],
};
