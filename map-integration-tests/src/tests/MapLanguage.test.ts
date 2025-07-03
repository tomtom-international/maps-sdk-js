import { expect, test } from '@playwright/test';
import type { SymbolLayerSpecification } from 'maplibre-gl';
import { MapTestEnv } from './util/MapTestEnv';
import { getLayerByID, putGlobalConfig, setLanguage, setStyle, waitForMapIdle } from './util/TestUtils';

const localizedExpression = (lang: string) => ['coalesce', ['get', `name_${lang}`], ['get', 'name']];

test.describe('Map localization tests', () => {
    const countryLayerId = 'Places - Country name';
    const cityLayerId = 'Places - City';

    test('default map localization with language value in sdk config', async ({ page }) => {
        const mapEnv = new MapTestEnv();
        await mapEnv.loadPage(page);
        await putGlobalConfig(page, { language: 'ar' });
        await mapEnv.loadMap(page, { zoom: 12, minZoom: 2, center: [-0.12621, 51.50394] });
        await waitForMapIdle(page);

        const countryLayerWithArText = (await getLayerByID(page, countryLayerId)) as SymbolLayerSpecification;
        const largeCityLayerWithArText = (await getLayerByID(page, cityLayerId)) as SymbolLayerSpecification;
        expect(countryLayerWithArText?.layout?.['text-field']).toEqual(localizedExpression('ar'));
        expect(largeCityLayerWithArText?.layout?.['text-field']).toEqual(localizedExpression('ar'));

        await setLanguage(page, 'es-ES');
        const countryLayerWithEnText = (await getLayerByID(page, countryLayerId)) as SymbolLayerSpecification;
        const largeCityLayerWithEnText = (await getLayerByID(page, cityLayerId)) as SymbolLayerSpecification;
        expect(countryLayerWithEnText?.layout?.['text-field']).toEqual(localizedExpression('es'));
        expect(largeCityLayerWithEnText?.layout?.['text-field']).toEqual(localizedExpression('es'));

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Map localization to multiple languages', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { zoom: 12, center: [-0.12621, 51.50394] });
        await waitForMapIdle(page);

        await setLanguage(page, 'en-GB');
        const countryLayerWithEnText = (await getLayerByID(page, countryLayerId)) as SymbolLayerSpecification;
        const largeCityLayerWithEnText = (await getLayerByID(page, cityLayerId)) as SymbolLayerSpecification;
        expect(countryLayerWithEnText?.layout?.['text-field']).toEqual(localizedExpression('en'));
        expect(largeCityLayerWithEnText?.layout?.['text-field']).toEqual(localizedExpression('en'));

        await setLanguage(page, 'nl-NL');
        await waitForMapIdle(page);
        let countryLayerWithNlText = (await getLayerByID(page, countryLayerId)) as SymbolLayerSpecification;
        let largeCityLayerWithNlText = (await getLayerByID(page, cityLayerId)) as SymbolLayerSpecification;
        expect(countryLayerWithNlText?.layout?.['text-field']).toEqual(localizedExpression('nl'));
        expect(largeCityLayerWithNlText?.layout?.['text-field']).toEqual(localizedExpression('nl'));

        // changing style, verifying nothing has changed:
        await setStyle(page, 'monoLight');
        await waitForMapIdle(page);

        countryLayerWithNlText = (await getLayerByID(page, countryLayerId)) as SymbolLayerSpecification;
        largeCityLayerWithNlText = (await getLayerByID(page, cityLayerId)) as SymbolLayerSpecification;
        expect(countryLayerWithNlText?.layout?.['text-field']).toEqual(localizedExpression('nl'));
        expect(largeCityLayerWithNlText?.layout?.['text-field']).toEqual(localizedExpression('nl'));

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
