import type { POICategory } from './category';

/**
 * Localized name for a POI category.
 *
 * Provides the category name in a specific language/locale.
 *
 * @example
 * ```typescript
 * const localizedName: LocalizedName = {
 *   nameLocale: 'en-US',
 *   name: 'Restaurant'
 * };
 * ```
 *
 * @group Place
 * @category Types
 */
export type LocalizedName = {
    /**
     * Language/locale code for this name.
     *
     * Uses IETF language tags (e.g., 'en-US', 'fr-FR', 'de-DE').
     */
    nameLocale: string;
    /**
     * Category name in the specified locale.
     *
     * Human-readable, localized category text.
     */
    name: string;
};

/**
 * POI category classification with localized names.
 *
 * Provides both a standardized category code and human-readable names
 * in multiple languages for displaying POI types.
 *
 * @example
 * ```typescript
 * const classification: Classification = {
 *   code: 'RESTAURANT',
 *   names: [
 *     { nameLocale: 'en-US', name: 'Restaurant' },
 *     { nameLocale: 'fr-FR', name: 'Restaurant' },
 *     { nameLocale: 'de-DE', name: 'Restaurant' }
 *   ]
 * };
 * ```
 *
 * @group Place
 * @category Types
 */
export type Classification = {
    /**
     * Standardized category code.
     *
     * Use this for programmatic filtering and identification of POI types.
     * See {@link POICategory} for available codes.
     */
    code: POICategory;
    /**
     * Localized names for this category.
     *
     * Array of names in different languages/locales for internationalization support.
     */
    names: LocalizedName[];
};
