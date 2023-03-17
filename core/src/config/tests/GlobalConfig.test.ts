import { GlobalConfig, TomTomConfig, mergeFromGlobal } from "../GlobalConfig";

describe("GlobalConfig", () => {
    afterEach(() => {
        TomTomConfig.instance.reset();
    });

    test("TomTomConfig is a singleton", () => {
        // @ts-ignore
        const newInstance = new TomTomConfig();
        const staticInstance = TomTomConfig.instance;

        expect(newInstance).toBe(staticInstance);
    });

    test("TomTomConfig contains default config", () => {
        expect(TomTomConfig.instance.get()).toEqual(
            expect.objectContaining({
                commonBaseURL: expect.any(String),
                apiKey: ""
            })
        );
    });

    test("TomTomConfig config can be modified", () => {
        const apiKey = "TEST_KEY";

        TomTomConfig.instance.put({ apiKey });

        expect(TomTomConfig.instance.get()).toEqual(
            expect.objectContaining({
                commonBaseURL: expect.any(String),
                apiKey
            })
        );
    });

    test("TomTomConfig config can be completely overwritten", () => {
        const cfg: GlobalConfig = {
            apiKey: "TEST_KEY",
            language: "nl-NL",
            commonBaseURL: "https://example.com"
        };

        TomTomConfig.instance.put(cfg);

        expect(TomTomConfig.instance.get()).toEqual(cfg);
    });
});

describe("mergeFromGlobal tests", () => {
    beforeEach(() => {
        TomTomConfig.instance.reset();
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
        TomTomConfig.instance.put({
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
