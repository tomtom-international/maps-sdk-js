import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapLayerGroupName, BaseMapModule, GeometriesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createLatestRequest, discoverPlaces, geometryData } from '@tomtom-org/maps-sdk/services';
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

    const geometryModule = await GeometriesModule.create(map, { fill: { style: 'inverted' } });
    const labelsToClick: BaseMapLayerGroupName[] = ['allPlaceLabels'];

    const baseMap = await BaseMapModule.get(map);

    const hintElement = document.getElementById('hint') as HTMLElement;
    const initialHint = hintElement.textContent;
    // A later click, on a label or off them, drops the boundary still on its way for an earlier one.
    const latestBoundary = createLatestRequest();

    const showBoundary = async (query: string, position: [number, number]) => {
        hintElement.hidden = true;
        // A failed lookup, or a match with no geometry id, leaves no boundary to show.
        const boundary = await latestBoundary.run(async (signal) => {
            try {
                const place = await discoverPlaces({
                    query,
                    geoBias: { position },
                    limit: 1,
                    filters: {
                        geographyTypes: [
                            'Municipality',
                            'Country',
                            'MunicipalitySubdivision',
                            'CountrySubdivision',
                            'Neighbourhood',
                        ],
                    },
                    signal,
                });
                return place.features[0]?.properties.dataSources?.geometry?.id
                    ? await geometryData({ geometries: place, signal })
                    : undefined;
            } catch {
                return undefined;
            }
        });
        if (!boundary.current) return;

        if (!boundary.value) {
            await clearBoundary();
        } else {
            await geometryModule.show(boundary.value);
            hintElement.textContent = `${query} — click anywhere to dismiss`;
            hintElement.hidden = false;
        }
    };

    const clearBoundary = async () => {
        await geometryModule.clear();
        hintElement.textContent = initialHint;
        hintElement.hidden = false;
    };

    // Two scopes of the one base map module. `where` narrows to part of the map and takes its own
    // event configuration, so each scope gets the hover cursor that suits it.
    baseMap.events
        .where({ layerGroups: { show: 'only', values: labelsToClick } })
        .on('click', async (feature, lngLat) => {
            await showBoundary(feature.properties.name, lngLat.toArray());
        });

    baseMap.events
        .where({ layerGroups: { show: 'all-except', values: labelsToClick } }, { cursorOnHover: 'default' })
        .on('click', () => {
            latestBoundary.cancel();
            return clearBoundary();
        });
})();
