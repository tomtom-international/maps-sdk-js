import type { SymbolLayerSpecification } from "maplibre-gl";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { getLayerByID, putGlobalConfig, setLanguage, setStyle, waitForMapIdle } from "./util/TestUtils";

const localizedExpression = (lang: string) => ["coalesce", ["get", `name_${lang}`], ["get", "name"]];

describe("Map localization tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    const countryLayerID = "Places - Country name";
    const cityLayerID = "Places - City";

    test("default map localization with language value in sdk config", async () => {
        await putGlobalConfig({ language: "ar" });
        await mapEnv.loadMap({ zoom: 12, minZoom: 2, center: [-0.12621, 51.50394] });
        await waitForMapIdle();

        const countryLayerWithARText = (await getLayerByID(countryLayerID)) as SymbolLayerSpecification;
        const largeCityLayerWithARText = (await getLayerByID(cityLayerID)) as SymbolLayerSpecification;
        expect(countryLayerWithARText?.layout?.["text-field"]).toEqual(localizedExpression("ar"));
        expect(largeCityLayerWithARText?.layout?.["text-field"]).toEqual(localizedExpression("ar"));

        await setLanguage("es-ES");
        const countryLayerWithENText = (await getLayerByID(countryLayerID)) as SymbolLayerSpecification;
        const largeCityLayerWithENText = (await getLayerByID(cityLayerID)) as SymbolLayerSpecification;
        expect(countryLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("es"));
        expect(largeCityLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("es"));
    });

    test("Map localization to multiple languages", async () => {
        await mapEnv.loadMap({ zoom: 12, center: [-0.12621, 51.50394] });
        await waitForMapIdle();

        await setLanguage("en-GB");
        const countryLayerWithENText = (await getLayerByID(countryLayerID)) as SymbolLayerSpecification;
        const largeCityLayerWithENText = (await getLayerByID(cityLayerID)) as SymbolLayerSpecification;
        expect(countryLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("en"));
        expect(largeCityLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("en"));

        await setLanguage("nl-NL");
        await waitForMapIdle();
        let countryLayerWithNLText = (await getLayerByID(countryLayerID)) as SymbolLayerSpecification;
        let largeCityLayerWithNLText = (await getLayerByID(cityLayerID)) as SymbolLayerSpecification;
        expect(countryLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl"));
        expect(largeCityLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl"));

        // changing style, verifying nothing has changed:
        await setStyle("monoLight");
        await waitForMapIdle();

        countryLayerWithNLText = (await getLayerByID(countryLayerID)) as SymbolLayerSpecification;
        largeCityLayerWithNLText = (await getLayerByID(cityLayerID)) as SymbolLayerSpecification;
        expect(countryLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl"));
        expect(largeCityLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl"));
    });
});
