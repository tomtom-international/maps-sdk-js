import { Language } from "../types";

/**
 * Global configuration containing basic parameters.
 * @group Configuration
 * @category Types
 */
export type GlobalConfig = {
    /**
     * A valid API Key for the requested functionality.
     *
     * A valid API Key is required to make use of the given feature.
     * It can be issued in the Developer Portal.
     * @default None
     */
    apiKey: string;

    /**
     * Specifies an identifier for the request. It can be used to trace a call.
     * * The value must match the regular expression '^[a-zA-Z0-9-]{1,100}$'.
     * * An example of the format that matches this regular expression is UUID: (e.g., 9ac68072-c7a4-11e8-a8d5-f2801f1b9fd1 ).
     * * For details check RFC 4122. If specified, it is replicated in the Tracking-ID response header.
     * * It is only meant to be used for support and does not involve tracking of you or your users in any form.
     * @see Tracking-ID: https://developer.tomtom.com/search-api/documentation/search-service/fuzzy-search#trackingid-response
     */
    trackingId?: string;

    /**
     * Overall language code for the SDK services and map.
     *
     * The value should correspond to one of the supported IETF language codes.
     * The code is case-insensitive.
     * @default NGT (Neutral Ground Truth - language local to each location)
     * @see Search: https://developer.tomtom.com/search-api/documentation/product-information/supported-languages
     * @see Routing: https://developer.tomtom.com/search-api/documentation/product-information/supported-languages
     */
    language?: Language;

    /**
     * Common base domain URL for all services, unless overwritten by any of them.
     * Must end with /.
     * @default https://api.tomtom.com/
     */
    commonBaseURL: string;
};

/**
 * Default global configuration contents.
 * @group Configuration
 * @category Variables
 */
export const defaultConfig: GlobalConfig = {
    commonBaseURL: "https://api.tomtom.com",
    apiKey: ""
};

//TODO: add back `@group Configuration` when md plugin >=4.0.0-next.11
/**
 * TomTom Maps SDK Global configuration singleton class.
 * It initializes to a default basic configuration.
 * @category Classes
 */
export class TomTomConfig {
    static readonly instance = new TomTomConfig();
    private config: GlobalConfig = { ...defaultConfig };

    private constructor() {
        return TomTomConfig.instance;
    }

    /**
     * Puts the content of the given config into this one, merging the two. The given config properties have priority.
     * @param config The config to merge into this one.
     */
    put(config: Partial<GlobalConfig>) {
        this.config = { ...this.config, ...config };
    }

    /**
     * Reset configuration to the default values
     */
    reset() {
        this.config = { ...defaultConfig };
    }

    /**
     * Get configuration object
     */
    get() {
        return this.config;
    }
}

/**
 * Merges the global configuration into the given one, with the latter having priority.
 * @ignore
 */
export const mergeFromGlobal = <T extends Partial<GlobalConfig>>(givenConfig: T = {} as T): T => ({
    ...TomTomConfig.instance.get(),
    ...givenConfig
});
