import { test, expect } from "@playwright/test";
import type { SymbolLayerSpecification } from "maplibre-gl";
import { MapTestEnv } from "./util/MapTestEnv";
import { getLayerByID, putGlobalConfig, setLanguage, setStyle, waitForMapIdle } from "./util/TestUtils";

const localizedExpression = (lang: string) => ["coalesce", ["get", `name_${lang}`], ["get", "name"]];

test.describe("Map localization tests", () => {
    const countryLayerID = "Places - Country name";
    const cityLayerID = "Places - City";

    test("default map localization with language value in sdk config", async ({ page }) => {
        const mapEnv = new MapTestEnv();
        await mapEnv.loadPage(page);
        await putGlobalConfig(page, { language: "ar" });
        await mapEnv.loadMap(page, { zoom: 12, minZoom: 2, center: [-0.12621, 51.50394] });
        await waitForMapIdle(page);

        const countryLayerWithARText = (await getLayerByID(page, countryLayerID)) as SymbolLayerSpecification;
        const largeCityLayerWithARText = (await getLayerByID(page, cityLayerID)) as SymbolLayerSpecification;
        expect(countryLayerWithARText?.layout?.["text-field"]).toEqual(localizedExpression("ar"));
        expect(largeCityLayerWithARText?.layout?.["text-field"]).toEqual(localizedExpression("ar"));

        await setLanguage(page, "es-ES");
        const countryLayerWithENText = (await getLayerByID(page, countryLayerID)) as SymbolLayerSpecification;
        const largeCityLayerWithENText = (await getLayerByID(page, cityLayerID)) as SymbolLayerSpecification;
        expect(countryLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("es"));
        expect(largeCityLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("es"));

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Map localization to multiple languages", async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { zoom: 12, center: [-0.12621, 51.50394] });
        await waitForMapIdle(page);

        await setLanguage(page, "en-GB");
        const countryLayerWithENText = (await getLayerByID(page, countryLayerID)) as SymbolLayerSpecification;
        const largeCityLayerWithENText = (await getLayerByID(page, cityLayerID)) as SymbolLayerSpecification;
        expect(countryLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("en"));
        expect(largeCityLayerWithENText?.layout?.["text-field"]).toEqual(localizedExpression("en"));

        await setLanguage(page, "nl-NL");
        await waitForMapIdle(page);
        let countryLayerWithNLText = (await getLayerByID(page, countryLayerID)) as SymbolLayerSpecification;
        let largeCityLayerWithNLText = (await getLayerByID(page, cityLayerID)) as SymbolLayerSpecification;
        expect(countryLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl"));
        expect(largeCityLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl"));

        // changing style, verifying nothing has changed:
        await setStyle(page, "monoLight");
        await waitForMapIdle(page);

        countryLayerWithNLText = (await getLayerByID(page, countryLayerID)) as SymbolLayerSpecification;
        largeCityLayerWithNLText = (await getLayerByID(page, cityLayerID)) as SymbolLayerSpecification;
        expect(countryLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl"));
        expect(largeCityLayerWithNLText?.layout?.["text-field"]).toEqual(localizedExpression("nl"));

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
