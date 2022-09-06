import { GlobalConfig, GOSDKConfig, mergeFromGlobal } from "../GlobalConfig";

describe("GlobalConfig", () => {
    afterEach(() => {
        GOSDKConfig.instance.reset();
    });

    test("GOSDKConfig is a singleton", () => {
        // @ts-ignore
        const newInstance = new GOSDKConfig();
        const staticInstance = GOSDKConfig.instance;

        expect(newInstance).toBe(staticInstance);
    });

    test("GOSDKConfig contains default config", () => {
        expect(GOSDKConfig.instance.get()).toEqual(
            expect.objectContaining({
                commonBaseURL: expect.any(String),
                apiKey: ""
            })
        );
    });

    test("GOSDKConfig config can be modified", () => {
        const apiKey = "TEST_KEY";

        GOSDKConfig.instance.put({ apiKey });

        expect(GOSDKConfig.instance.get()).toEqual(
            expect.objectContaining({
                commonBaseURL: expect.any(String),
                apiKey
            })
        );
    });

    test("GOSDKConfig config can be completely overwritten", () => {
        const cfg: GlobalConfig = {
            apiKey: "TEST_KEY",
            language: "nl-NL",
            commonBaseURL: "https://example.com"
        };

        GOSDKConfig.instance.put(cfg);

        expect(GOSDKConfig.instance.get()).toEqual(cfg);
    });
});

describe("mergeFromGlobal tests", () => {
    beforeEach(() => {
        GOSDKConfig.instance.reset();
    });

    test("mergeFromGlobal with default global config", () => {
        expect(mergeFromGlobal()).toEqual({ commonBaseURL: "https://api.tomtom.com", apiKey: "" });
        expect(mergeFromGlobal({ randomProp: "blah", apiKey: "CUSTOM_API_KEY" })).toEqual({
            apiKey: "CUSTOM_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            randomProp: "blah"
        });
    });

    test("mergeFromGlobal with given global config", () => {
        GOSDKConfig.instance.put({
            apiKey: "GLOBAL_API_KEY",
            language: "it-IT"
        });
        expect(mergeFromGlobal()).toEqual({
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            language: "it-IT"
        });
        expect(mergeFromGlobal({})).toEqual({
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            language: "it-IT"
        });
        expect(mergeFromGlobal<Partial<GlobalConfig> & { randomProp: string }>({ randomProp: "blah" })).toEqual({
            randomProp: "blah",
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            language: "it-IT"
        });
        expect(
            mergeFromGlobal({
                randomProp: "blah",
                apiKey: "CUSTOM_API_KEY",
                commonBaseURL: "CUSTOM",
                language: "es-ES"
            })
        ).toEqual({
            randomProp: "blah",
            apiKey: "CUSTOM_API_KEY",
            commonBaseURL: "CUSTOM",
            language: "es-ES"
        });
    });
});
