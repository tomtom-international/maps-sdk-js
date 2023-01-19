/**
 * Languages avaible.
 * @see List of supported languages: https://developer.tomtom.com/map-display-api/documentation/vector/content-v2#list-of-supported-languages
 */
const LanguagesAvailable = {
    // Neutral Ground Truth (custom)
    ngt: "ngt",
    // Latin script will be used if available.
    "ngt-Latn": "ngt-Latn",
    // Arabic
    ar: "ar",
    // Bulgarian,
    "bg-BG": "bg-BG",
    // Chinese (Taiwan)
    "zh-TW": "zh-TW",
    // Chinese (Simplified)
    "zh-CN": "zh-CN",
    // Czech
    "cs-CZ": "cs-CZ",
    // Danish
    "da-DK": "da-DK",
    // Dutch
    "nl-NL": "nl-NL",
    // English (Australia)
    "en-AU": "en-AU",
    // English (Canada)
    "en-CA": "en-CA",
    // English (Great Britain)
    "en-GB": "en-GB",
    // English (New Zealand)
    "en-NZ": "en-NZ",
    // English (USA)
    "en-US": "en-US",
    // Finnish
    "fi-FI": "fi-FI",
    // French
    "fr-FR": "fr-FR",
    // German
    "de-DE": "de-DE",
    // Greek
    "el-GR": "el-GR",
    // Hungarian
    "hu-HU": "hu-HU",
    // Indonesian
    "id-ID": "id-ID",
    // Italian
    "it-IT": "it-IT",
    // Korean
    "ko-KR": "ko-KR",
    // Korean written in the Latin script.
    "ko-Latn-KR": "ko-Latn-KR",
    // Lithuanian
    "lt-LT": "lt-LT",
    // Malay
    "ms-MY": "ms-MY",
    // Norwegian
    "nb-NO": "nb-NO",
    // Polish
    "pl-PL": "pl-PL",
    // Portuguese (Brazil)
    "pt-BR": "pt-BR",
    // Portuguese (Portugal)
    "pt-PT": "pt-PT",
    // Russian written in the Cyrillic script.
    "ru-RU": "ru-RU",
    // Russian written in the Latin script.
    "ru-Latn-RU": "ru-Latn-RU",
    // Russian written in the Cyrillic script.
    // Cyrillic script used where possible.
    "ru-Cyrl-RU": "ru-Cyrl-RU",
    // Slovak
    "sk-SK": "sk-SK",
    // Slovenian
    "sl-SI": "sl-SI",
    // Spanish (Castilian)
    "es-ES": "es-ES",
    // Spanish (Mexico)
    "es-MX": "es-MX",
    // Swedish
    "sv-SE": "sv-SE",
    // Thai
    "th-TH": "th-TH",
    // Turkish
    "tr-TR": "tr-TR"
} as const;

export type MapLanguagesAvailable = keyof typeof LanguagesAvailable;
