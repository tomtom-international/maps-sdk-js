import { Languange } from "../types/MapLanguageConfig";

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
     * Overall language code for the SDK services and map.
     *
     * The value should correspond to one of the supported IETF language codes.
     * The code is case-insensitive.
     * @default NGT (Neutral Ground Truth - language local to each location)
     * @see Search: https://developer.tomtom.com/search-api/documentation/product-information/supported-languages
     * @see Routing: https://developer.tomtom.com/search-api/documentation/product-information/supported-languages
     */
    language?: Languange;

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

/**
 * GO SDK Global configuration singleton class.
 * It initializes to a default basic configuration.
 * @group Configuration
 * @category Types
 */
export class GOSDKConfig {
    static readonly instance = new GOSDKConfig();
    private config: GlobalConfig = { ...defaultConfig };

    private constructor() {
        return GOSDKConfig.instance;
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
    ...GOSDKConfig.instance.get(),
    ...givenConfig
});
