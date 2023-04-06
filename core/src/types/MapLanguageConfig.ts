/**
 * [Supported languages](https://developer.tomtom.com/map-display-api/documentation/vector/content-v2#list-of-supported-languages)
 */
const Languages = [
    "ngt", // Neutral Ground Truth (custom)
    "ngt-Latn", // Latin script will be used if available.
    "ar", // Arabic
    "bg-BG", // Bulgarian,
    "zh-TW", // Chinese (Taiwan)
    "zh-CN", // Chinese (Simplified)
    "cs-CZ", // Czech
    "da-DK", // Danish
    "nl-NL", // Dutch
    "en-AU", // English (Australia)
    "en-CA", // English (Canada)
    "en-GB", // English (Great Britain)
    "en-NZ", // English (New Zealand)
    "en-US", // English (USA)
    "fi-FI", // Finnish
    "fr-FR", // French
    "de-DE", // German
    "el-GR", // Greek
    "hu-HU", // Hungarian
    "id-ID", // Indonesian
    "it-IT", // Italian
    "ko-KR", // Korean
    "ko-Latn-KR", // Korean written in the Latin script.
    "lt-LT", // Lithuanian
    "ms-MY", // Malay
    "nb-NO", // Norwegian
    "pl-PL", // Polish
    "pt-BR", // Portuguese (Brazil)
    "pt-PT", // Portuguese (Portugal)
    "ru-RU", // Russian written in the Cyrillic script.
    "ru-Latn-RU", // Russian written in the Latin script.
    "ru-Cyrl-RU", // Russian written in the Cyrillic script. Cyrillic script used where possible.
    "sk-SK", // Slovak
    "sl-SI", // Slovenian
    "es-ES", // Spanish (Castilian)
    "es-MX", // Spanish (Mexico)
    "sv-SE", // Swedish
    "th-TH", // Thai
    "tr-TR" // Turkish
] as const;

/**
 * [Supported language](https://developer.tomtom.com/map-display-api/documentation/vector/content-v2#list-of-supported-languages)
 * @group Shared
 * @category Types
 */
export type Language = (typeof Languages)[number];
