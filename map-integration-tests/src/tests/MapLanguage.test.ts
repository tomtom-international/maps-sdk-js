import { SymbolLayerSpecification } from "maplibre-gl";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { getLayerByID, putGlobalConfig, setLanguage, setStyle, waitForMapIdle } from "./util/TestUtils";

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

        const countryLayerWithARText = (await getLayerByID(countryLayerID)) as SymbolLayerSpecification;
        const largeCityLayerWithARText = (await getLayerByID(largeCityLayerID)) as SymbolLayerSpecification;
        expect(countryLayerWithARText?.layout?.["text-field"]).toEqual(localizedExpression("ar"));
        expect(largeCityLayerWithARText?.layout?.["text-field"]).toEqual(localizedExpression("ar"));

        await setLanguage("es-ES");
        const countryLayerWithENText = (await getLayerByID(countryLayerID)) as SymbolLayerSpecification;
        const largeCityLayerWithENText = (await getLayerByID(largeCityLayerID)) as SymbolLayerSpecification;
        expect(countryLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("es-ES"));
        expect(largeCityLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("es-ES"));
    });

    test("Map localization to multiple languages", async () => {
        await mapEnv.loadMap({ zoom: 14, center: [-0.12621, 51.50394] });
        await waitForMapIdle();

        await setLanguage("en-GB");
        const countryLayerWithENText = (await getLayerByID(countryLayerID)) as SymbolLayerSpecification;
        const largeCityLayerWithENText = (await getLayerByID(largeCityLayerID)) as SymbolLayerSpecification;
        expect(countryLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("en-GB"));
        expect(largeCityLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("en-GB"));

        await setLanguage("nl-NL");
        await waitForMapIdle();
        let countryLayerWithNLText = (await getLayerByID(countryLayerID)) as SymbolLayerSpecification;
        let largeCityLayerWithNLText = (await getLayerByID(largeCityLayerID)) as SymbolLayerSpecification;
        expect(countryLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl-NL"));
        expect(largeCityLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl-NL"));

        // changing style, verifying nothing has changed:
        await setStyle("monoLight");
        await waitForMapIdle();

        countryLayerWithNLText = (await getLayerByID(countryLayerID)) as SymbolLayerSpecification;
        largeCityLayerWithNLText = (await getLayerByID(largeCityLayerID)) as SymbolLayerSpecification;
        expect(countryLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl-NL"));
        expect(largeCityLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl-NL"));
    });
});
