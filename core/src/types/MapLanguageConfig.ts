/**
 * Languages available.
 * @see List of supported languages: https://developer.tomtom.com/map-display-api/documentation/vector/content-v2#list-of-supported-languages
 */
const Languages = [
    // Neutral Ground Truth (custom)
    "ngt",
    // Latin script will be used if available.
    "ngt-Latn",
    // Arabic
    "ar",
    // Bulgarian,
    "bg-BG",
    // Chinese (Taiwan)
    "zh-TW",
    // Chinese (Simplified)
    "zh-CN",
    // Czech
    "cs-CZ",
    // Danish
    "da-DK",
    // Dutch
    "nl-NL",
    // English (Australia)
    "en-AU",
    // English (Canada)
    "en-CA",
    // English (Great Britain)
    "en-GB",
    // English (New Zealand)
    "en-NZ",
    // English (USA)
    "en-US",
    // Finnish
    "fi-FI",
    // French
    "fr-FR",
    // German
    "de-DE",
    // Greek
    "el-GR",
    // Hungarian
    "hu-HU",
    // Indonesian
    "id-ID",
    // Italian
    "it-IT",
    // Korean
    "ko-KR",
    // Korean written in the Latin script.
    "ko-Latn-KR",
    // Lithuanian
    "lt-LT",
    // Malay
    "ms-MY",
    // Norwegian
    "nb-NO",
    // Polish
    "pl-PL",
    // Portuguese (Brazil)
    "pt-BR",
    // Portuguese (Portugal)
    "pt-PT",
    // Russian written in the Cyrillic script.
    "ru-RU",
    // Russian written in the Latin script.
    "ru-Latn-RU",
    // Russian written in the Cyrillic script.
    // Cyrillic script used where possible.
    "ru-Cyrl-RU",
    // Slovak
    "sk-SK",
    // Slovenian
    "sl-SI",
    // Spanish (Castilian)
    "es-ES",
    // Spanish (Mexico)
    "es-MX",
    // Swedish
    "sv-SE",
    // Thai
    "th-TH",
    // Turkish
    "tr-TR"
] as const;

/**
 * @group Shared
 * @category Types
 */
export type Language = (typeof Languages)[number];
