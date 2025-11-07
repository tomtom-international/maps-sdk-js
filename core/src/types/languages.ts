/**
 * Array of all supported language codes for map display and service responses.
 *
 * This constant array contains all valid language codes that can be used to configure
 * the language for map labels, place names, addresses, and other textual content.
 *
 * The array includes:
 * - Region-specific language variants (e.g., `en-US`, `en-GB`, `pt-BR`, `pt-PT`)
 * - Script-specific variants (e.g., `zh-Hans` for Simplified Chinese, `zh-Hant` for Traditional Chinese)
 * - Special codes like `ngt` (Neutral Ground Truth) for language-neutral content
 * - Latin script alternatives (e.g., `ngt-Latn`, `ko-Latn-KR`, `ru-Latn-RU`)
 * - Cyrillic script variants (e.g., `ru-Cyrl-RU`)
 *
 * Use this array to:
 * - Validate user-provided language codes
 * - Generate language selection UI components
 * - Iterate over all available language options
 * - Check if a language code is supported
 *
 * @see {@link Language} - The type derived from this array
 * @see [Supported languages documentation](https://docs.tomtom.com/map-display-api/documentation/vector/content-v2#list-of-supported-languages)
 *
 * @example
 * ```typescript
 * // Validate a language code
 * const userLanguage = 'en-US';
 * if (languages.includes(userLanguage)) {
 *   console.log('Language is supported');
 * }
 *
 * // Create a language selector
 * languages.forEach(lang => {
 *   console.log(`Available language: ${lang}`);
 * });
 *
 * // Check total number of supported languages
 * console.log(`Total languages: ${languages.length}`);
 * ```
 *
 * @group Shared
 */
export const languages = [
    'ngt', // Neutral Ground Truth (custom)
    'ngt-Latn', // Latin script will be used if available.
    'ar', // Arabic
    'bg-BG', // Bulgarian,
    'zh-Hant', // Chinese (Taiwan)
    'zh-Hans', // Chinese (Simplified)
    'cs-CZ', // Czech
    'da-DK', // Danish
    'nl-NL', // Dutch
    'en-AU', // English (Australia)
    'en-CA', // English (Canada)
    'en-GB', // English (Great Britain)
    'en-NZ', // English (New Zealand)
    'en-US', // English (USA)
    'fi-FI', // Finnish
    'fr-FR', // French
    'de-DE', // German
    'el-GR', // Greek
    'hu-HU', // Hungarian
    'id-ID', // Indonesian
    'it-IT', // Italian
    'ko-KR', // Korean
    'ko-Latn-KR', // Korean written in the Latin script.
    'lt-LT', // Lithuanian
    'ms-MY', // Malay
    'nb-NO', // Norwegian
    'pl-PL', // Polish
    'pt-BR', // Portuguese (Brazil)
    'pt-PT', // Portuguese (Portugal)
    'ru-RU', // Russian written in the Cyrillic script.
    'ru-Latn-RU', // Russian written in the Latin script.
    'ru-Cyrl-RU', // Russian written in the Cyrillic script. Cyrillic script used where possible.
    'sk-SK', // Slovak
    'sl-SI', // Slovenian
    'es-ES', // Spanish (Castilian)
    'es-MX', // Spanish (Mexico)
    'sv-SE', // Swedish
    'th-TH', // Thai
    'tr-TR', // Turkish
] as const;

/**
 * Language code for map display and service responses.
 *
 * Determines the language used for:
 * - Map labels and text on vector tiles
 * - Place names, addresses, and other textual content in service responses
 *
 * Supports various locales with region-specific variants (e.g., `en-US`, `en-GB`).
 * Special codes like `ngt` (Neutral Ground Truth) and `ngt-Latn` provide language-neutral
 * or Latin script alternatives.
 *
 * @see [Supported languages documentation](https://docs.tomtom.com/map-display-api/documentation/vector/content-v2#list-of-supported-languages)
 *
 * @example
 * ```typescript
 * // Use US English
 * const language: Language = 'en-US';
 *
 * // Use simplified Chinese
 * const language: Language = 'zh-Hans';
 *
 * // Use neutral ground truth (no translation)
 * const language: Language = 'ngt';
 * ```
 *
 * @group Shared
 */
export type Language = (typeof languages)[number];
