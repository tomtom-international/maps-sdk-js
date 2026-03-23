import type { Language } from '@tomtom-org/maps-sdk/core';
import type { POICategoryResult } from './types';

const cache = new Map<Language, POICategoryResult[]>();
const textCache = new Map<Language, Record<string, POICategoryResult>>();

const DEFAULT_LANGUAGE: Language = 'en-GB';

const getWithDefault = (language: Language | undefined): Language => language ?? DEFAULT_LANGUAGE;

export const normalizeText = (text: string): string => text.toLowerCase().replaceAll(/[\s\-_,]+/g, '');

/** @ignore */
export const getCachedCategories = (language: Language | undefined): POICategoryResult[] | undefined => {
    return cache.get(getWithDefault(language));
};

/** @ignore */
export const setCachedCategories = (language: Language | undefined, categories: POICategoryResult[]): void => {
    const lang = getWithDefault(language);
    cache.set(lang, categories);
    textCache.set(lang, buildTextCache(categories));
};

/** @ignore */
export const buildTextCache = (categories: POICategoryResult[]): Record<string, POICategoryResult> => {
    const cache: Record<string, POICategoryResult> = {};
    for (const category of categories) {
        const texts = [category.name, ...category.synonyms].map(normalizeText);
        for (const text of texts) {
            cache[text] = category;
        }
    }
    return cache;
};

/** @ignore */
export const getCachedTextEntries = (language: Language | undefined): Record<string, POICategoryResult> =>
    textCache.get(language ?? DEFAULT_LANGUAGE) ?? {};
