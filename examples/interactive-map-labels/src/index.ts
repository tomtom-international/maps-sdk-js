import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapLayerGroupName, BaseMapModule, GeometriesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geometryData, search } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [-74.00332, 40.71732],
            zoom: 10,
        },
    });

    const geometryModule = await GeometriesModule.get(map, { theme: 'inverted' });
    const labelsToClick: BaseMapLayerGroupName[] = ['placeLabels', 'stateLabels', 'capitalLabels', 'countryLabels'];

    const baseMap = await BaseMapModule.get(map, {
        layerGroupsFilter: { mode: 'include', names: labelsToClick },
    });

    const restOfTheMap = await BaseMapModule.get(map, {
        layerGroupsFilter: { mode: 'exclude', names: labelsToClick },
        events: { cursorOnHover: 'default' },
    });

    const hintEl = document.getElementById('hint') as HTMLElement;

    const showBoundary = async (query: string, position: [number, number]) => {
        hintEl.hidden = true;
        const place = await search({
            query,
            position,
            limit: 1,
            geographyTypes: [
                'Municipality',
                'Country',
                'MunicipalitySubdivision',
                'CountrySubdivision',
                'Neighbourhood',
            ],
        });
        if (!place.features.length) {
            await clearBoundary();
        } else {
            await geometryModule.show(await geometryData({ geometries: place }));
            hintEl.textContent = `${query} — click anywhere to dismiss`;
            hintEl.hidden = false;
        }
    };

    const clearBoundary = async () => {
        await geometryModule.clear();
        hintEl.textContent = 'Click a city label to show its boundary';
    };

    baseMap.events.on('click', async (feature, lngLat) => {
        await showBoundary(feature.properties.name, lngLat.toArray());
    });

    restOfTheMap.events.on('click', clearBoundary);
})();
