export type GlobalConfig = {
    /**
     * A valid API Key for the requested functionality.
     *
     * A valid API Key is required to make use of the given feature.
     * It can be issued in the Developer Portal.
     * @default None
     */
    apiKey?: string;

    /**
     * Overall language code for the SDK services and map.
     *
     * The value should correspond to one of the supported IETF language codes.
     * The list is available here.
     * The code is case-insensitive.
     * @default NGT (Neutral Ground Truth - language local to each location)
     */
    language?: string;

    /**
     * Common base domain URL for all services, unless overwritten by any of them.
     * Must end with /.
     * @default https://api.tomtom.com/
     */
    baseDomainURL?: string;
};

const defaultConfig: GlobalConfig = {
    baseDomainURL: "https://api.tomtom.com/"
};

export class GOSDKConfig {
    static instance = new GOSDKConfig();
    private config: GlobalConfig = defaultConfig;

    private constructor() {}

    /**
     * Puts the content of the given config into this one, merging the two. The given config properties have priority.
     * @param config The config to merge into this one.
     */
    public put(config: Partial<GlobalConfig>) {
        this.config = { ...this.config, ...config };
    }

    /**
     * Sets the given config, completely overwritting the current one.
     * @param config The config to set.
     */
    public set(config: GlobalConfig) {
        this.config = config;
    }

    public get() {
        return this.config;
    }
}

export const mergeFromGlobal = <T extends GlobalConfig>(givenConfig: T = {} as T): T => ({
    ...GOSDKConfig.instance.get(),
    ...givenConfig
});
