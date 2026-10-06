import type { Language } from '@tomtom-org/maps-sdk/core';

export type CategorySearch = { poiCategoryQuery: string; language: Language };

// `filters.poiCategoryQuery` matches category names in the call's language, so each language starts
// with a word of its own.
export const categoryWords: (CategorySearch & { name: string })[] = [
    { language: 'en-GB', name: 'English', poiCategoryQuery: 'sushi' },
    { language: 'fr-FR', name: 'Français', poiCategoryQuery: 'boulangerie' },
    { language: 'nl-NL', name: 'Nederlands', poiCategoryQuery: 'apotheek' },
    { language: 'de-DE', name: 'Deutsch', poiCategoryQuery: 'Museum' },
    { language: 'es-ES', name: 'Español', poiCategoryQuery: 'gasolinera' },
];
