import { getSymbolLayersByID, waitForMapStyleToLoad, MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { GOSDKThis } from "./types/GOSDKThis";

const calcLocalizedTextFieldExpression = (lang: string) => ["coalesce", ["get", `name_${lang}`], ["get", "name"]];

describe("Map localization tests", () => {
    const mapEnv = new MapIntegrationTestEnv();
    const countryLayerID = "Places - Country name";
    const largeCityLayerID = "Places - Large city";

    beforeEach(async () => {
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
        expect(countryLayerWithARText?.layout?.["text-field"]).toEqual(calcLocalizedTextFieldExpression("ar"));
        expect(largeCityLayerWithARText?.layout?.["text-field"]).toEqual(calcLocalizedTextFieldExpression("ar"));

        await page.evaluate(() => (globalThis as GOSDKThis).goSDKMap.localizeMap("es-ES"));
        const countryLayerWithENText = await getSymbolLayersByID(countryLayerID);
        const largeCityLayerWithENText = await getSymbolLayersByID(largeCityLayerID);
        expect(countryLayerWithENText?.layout?.["text-field"]).toEqual(calcLocalizedTextFieldExpression("es-ES"));
        expect(largeCityLayerWithENText?.layout?.["text-field"]).toEqual(calcLocalizedTextFieldExpression("es-ES"));
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
        expect(countryLayerWithENText?.layout?.["text-field"]).toEqual(calcLocalizedTextFieldExpression("en-GB"));
        expect(largeCityLayerWithENText?.layout?.["text-field"]).toEqual(calcLocalizedTextFieldExpression("en-GB"));

        await page.evaluate(() => (globalThis as GOSDKThis).goSDKMap.localizeMap("nl-NL"));
        const countryLayerWithNLText = await getSymbolLayersByID(countryLayerID);
        const largeCityLayerWithNLText = await getSymbolLayersByID(largeCityLayerID);
        expect(countryLayerWithNLText?.layout?.["text-field"]).toEqual(calcLocalizedTextFieldExpression("nl-NL"));
        expect(largeCityLayerWithNLText?.layout?.["text-field"]).toEqual(calcLocalizedTextFieldExpression("nl-NL"));
    });
});
