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
     * Language code that decides in which language the results
     * should be returned.
     *
     * The value should correspond to one of the supported IETF language codes.
     * The list is available here.
     * The code is case insensitive.
     * @default null
     */
    language?: string;

    baseURL?: string;
};

const defaultConfig: GlobalConfig = {
    language: "en-GB",
    baseURL: "https://api.tomtom.com/"
};

export class GOSDKConfig {
    static instance = new GOSDKConfig();
    private config: GlobalConfig = defaultConfig;

    private constructor() {
        this.config = defaultConfig;
    }

    public add = (config: GlobalConfig) => {
        this.config = { ...this.config, ...config };
    };

    public set = (config: GlobalConfig) => {
        this.config = config;
    };

    public get = () => this.config;
}

export const mergeFromGlobal = <T extends GlobalConfig>(givenConfig: T = {} as T): T => ({
    ...GOSDKConfig.instance.get(),
    ...givenConfig
});
