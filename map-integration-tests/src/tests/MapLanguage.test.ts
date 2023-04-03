import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { getSymbolLayersByID, putGlobalConfig, setLanguage, setStyle, waitForMapIdle } from "./util/TestUtils";

const localizedExpression = (lang: string) => ["coalesce", ["get", `name_${lang}`], ["get", "name"]];

describe("Map localization tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    const countryLayerID = "Places - Country name";
    const largeCityLayerID = "Places - Large city";

    test("default map localization with language value in sdk config", async () => {
        await putGlobalConfig({ language: "ar" });
        await mapEnv.loadMap({ zoom: 14, minZoom: 2, center: [-0.12621, 51.50394] });
        await waitForMapIdle();

        const countryLayerWithARText = await getSymbolLayersByID(countryLayerID);
        const largeCityLayerWithARText = await getSymbolLayersByID(largeCityLayerID);
        expect(countryLayerWithARText?.layout?.["text-field"]).toEqual(localizedExpression("ar"));
        expect(largeCityLayerWithARText?.layout?.["text-field"]).toEqual(localizedExpression("ar"));

        await setLanguage("es-ES");
        const countryLayerWithENText = await getSymbolLayersByID(countryLayerID);
        const largeCityLayerWithENText = await getSymbolLayersByID(largeCityLayerID);
        expect(countryLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("es-ES"));
        expect(largeCityLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("es-ES"));
    });

    test("Map localization to multiple languages", async () => {
        await mapEnv.loadMap({ zoom: 14, center: [-0.12621, 51.50394] });
        await waitForMapIdle();

        await setLanguage("en-GB");
        const countryLayerWithENText = await getSymbolLayersByID(countryLayerID);
        const largeCityLayerWithENText = await getSymbolLayersByID(largeCityLayerID);
        expect(countryLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("en-GB"));
        expect(largeCityLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("en-GB"));

        await setLanguage("nl-NL");
        await waitForMapIdle();
        let countryLayerWithNLText = await getSymbolLayersByID(countryLayerID);
        let largeCityLayerWithNLText = await getSymbolLayersByID(largeCityLayerID);
        expect(countryLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl-NL"));
        expect(largeCityLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl-NL"));

        // changing style, verifying nothing has changed:
        await setStyle("monoLight");
        await waitForMapIdle();

        countryLayerWithNLText = await getSymbolLayersByID(countryLayerID);
        largeCityLayerWithNLText = await getSymbolLayersByID(largeCityLayerID);
        expect(countryLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl-NL"));
        expect(largeCityLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl-NL"));
    });
});
