import { getSymbolLayersByID, waitForMapStyleToLoad, MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { GOSDKThis } from "./types/GOSDKThis";

describe("Map localization tests", () => {
    const mapEnv = new MapIntegrationTestEnv();
    const localizedTextFieldExpressionEN = ["coalesce", ["get", "name_en-GB"], ["get", "name"]];
    const localizedTextFieldExpressionNL = ["coalesce", ["get", "name_nl-NL"], ["get", "name"]];
    const localizedTextFieldExpressionAR = ["coalesce", ["get", "name_ar"], ["get", "name"]];
    const countryLayerID = "Places - Country name";
    const largeCityLayerID = "Places - Large city";

    beforeAll(async () => {
        await mapEnv.loadPage();
    });

    test("default map localization with language value in sdk config", async () => {
        await mapEnv.loadMap(
            {
                zoom: 14,
                minZoom: 2,
                center: [-0.12621, 51.50394]
            },
            {
                language: "ar"
            }
        );
        await waitForMapStyleToLoad();

        const countryLayerWithARText = await getSymbolLayersByID(countryLayerID);
        const largeCityLayerWithARText = await getSymbolLayersByID(largeCityLayerID);
        expect(countryLayerWithARText?.layout?.["text-field"]).toEqual(localizedTextFieldExpressionAR);
        expect(largeCityLayerWithARText?.layout?.["text-field"]).toEqual(localizedTextFieldExpressionAR);
    });

    test("Map localization to multiple languages", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });
        await waitForMapStyleToLoad();

        await page.evaluate(() => (globalThis as GOSDKThis).goSDKMap.localizeMap("en-GB"));
        const countryLayerWithENText = await getSymbolLayersByID(countryLayerID);
        const largeCityLayerWithENText = await getSymbolLayersByID(largeCityLayerID);
        expect(countryLayerWithENText?.layout?.["text-field"]).toEqual(localizedTextFieldExpressionEN);
        expect(largeCityLayerWithENText?.layout?.["text-field"]).toEqual(localizedTextFieldExpressionEN);

        await page.evaluate(() => (globalThis as GOSDKThis).goSDKMap.localizeMap("nl-NL"));
        const countryLayerWithNLText = await getSymbolLayersByID(countryLayerID);
        const largeCityLayerWithNLText = await getSymbolLayersByID(largeCityLayerID);
        expect(countryLayerWithNLText?.layout?.["text-field"]).toEqual(localizedTextFieldExpressionNL);
        expect(largeCityLayerWithNLText?.layout?.["text-field"]).toEqual(localizedTextFieldExpressionNL);
    });
});
