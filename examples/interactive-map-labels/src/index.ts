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

    const geometryModule = await GeometriesModule.create(map, { theme: 'inverted' });
    const labelsToClick: BaseMapLayerGroupName[] = ['allPlaceLabels', 'stateLabels', 'capitalLabels', 'countryLabels'];

    const baseMap = await BaseMapModule.get(map);

    const hintEl = document.getElementById('hint') as HTMLElement;

    const showBoundary = async (query: string, position: [number, number]) => {
        hintEl.hidden = true;
        const place = await search({
            query,
            geoBias: { position },
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

    // Two scopes of the one base map module. `where` narrows to part of the map and takes its own
    // event configuration, so each scope gets the hover cursor that suits it.
    baseMap.events
        .where({ layerGroups: { mode: 'include', names: labelsToClick } })
        .on('click', async (feature, lngLat) => {
            await showBoundary(feature.properties.name, lngLat.toArray());
        });

    baseMap.events
        .where({ layerGroups: { mode: 'exclude', names: labelsToClick } }, { cursorOnHover: 'default' })
        .on('click', clearBoundary);
})();
