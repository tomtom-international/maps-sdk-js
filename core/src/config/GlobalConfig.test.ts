import { GlobalConfig, GOSDKConfig } from "./GlobalConfig";

describe("GlobalConfig", () => {
    afterEach(() => {
        GOSDKConfig.instance.reset();
    });

    test("GOSDKConfig is a singleton", () => {
        // @ts-ignore
        const newInstance = new GOSDKConfig();
        const staticInstance = GOSDKConfig.instance;

        expect(newInstance === staticInstance).toEqual(true);
    });

    test("GOSDKConfig contains default config", () => {
        expect(GOSDKConfig.instance.get()).toEqual(
            expect.objectContaining({
                baseDomainURL: expect.any(String),
                apiKey: ""
            })
        );
    });

    test("GOSDKConfig config can be modified", () => {
        const apiKey = "TEST_KEY";

        GOSDKConfig.instance.put({ apiKey });

        expect(GOSDKConfig.instance.get()).toEqual(
            expect.objectContaining({
                baseDomainURL: expect.any(String),
                apiKey
            })
        );
    });

    test("GOSDKConfig config can be completely overwritten", () => {
        const cfg: GlobalConfig = {
            apiKey: "TEST_KEY",
            language: "nl-NL",
            baseDomainURL: "https://example.com"
        };

        GOSDKConfig.instance.set(cfg);

        expect(GOSDKConfig.instance.get()).toEqual(cfg);
    });
});
