import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { type BaseMapLayerGroupName, BaseMapModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { type ReverseGeocodingResponse, reverseGeocode } from '@tomtom-org/maps-sdk/services';
import { distance } from '@turf/turf';
import type { Feature, FeatureCollection, Position } from 'geojson';
import { Map, type PointLike } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';
import { findClosestLineString } from './findClosestLineString';
import { createInvertedBuffer } from './invertedBuffer';
import { initHoveredSourceAndLayers, initSelectedSourceAndLayers } from './sourceAndLayers';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    // Calculates the amount of meters for the given amount of pixels and reference map coordinates.
    // NOTE: the reference coordinates have an impact due to the mercator projection.
    const pxToMeters = (numPixels: number, map: Map): number => {
        const referenceLngLat = map.getCenter();
        const startPixels = map.project(map.getCenter());
        const nextPointInPixels: PointLike = [startPixels.x, numPixels + startPixels.y];
        const nextPointLngLat = map.unproject(nextPointInPixels);
        return Math.ceil(
            distance([referenceLngLat.lng, referenceLngLat.lat], [nextPointLngLat.lng, nextPointLngLat.lat], {
                units: 'meters',
            }),
        );
    };

    const map = new TomTomMap({
        container: 'sdk-map',
        center: [-74.00332, 40.71732],
        zoom: 18,
    });
    const mapLibreMap = map.mapLibreMap;

    const interactiveGroupNames: BaseMapLayerGroupName[] = ['roadLines', 'roadLabels', 'roadShields', 'houseNumbers'];
    const interactiveGroups = await BaseMapModule.get(map, {
        layerGroupsFilter: { mode: 'include', names: interactiveGroupNames },
    });
    const restOfTheMap = await BaseMapModule.get(map, {
        layerGroupsFilter: { mode: 'exclude', names: [...interactiveGroupNames, 'placeLabels'] },
        events: { cursorOnHover: 'default' },
    });

    const hoveredSource = initHoveredSourceAndLayers(mapLibreMap);
    const selectedSource = initSelectedSourceAndLayers(mapLibreMap);

    const titleElement = document.querySelector('#sdk-example-title') as Element;
    const subtitleElement = document.querySelector('#sdk-example-subtitle') as Element;
    const addressesElement = document.querySelector('#sdk-example-addresses') as Element;

    const setTitleAndSubtitle = (feature: Feature<any, any>) => {
        titleElement.innerHTML = `${feature.properties.category} ${feature.properties.subcategory ?? ''}`;
        subtitleElement.innerHTML = feature.properties.name ?? '';
    };

    const showRevGeoResponses = (responses: ReverseGeocodingResponse[]) => {
        addressesElement.innerHTML = responses
            .map((response) => response.properties.address.freeformAddress)
            .join('<br>');
    };

    let clickedFeature: Feature<any, any> | undefined;
    interactiveGroups.events.on('hover', (feature, lngLat) => {
        if (!clickedFeature) {
            const extractedFeature = findClosestLineString(feature, [lngLat.lng, lngLat.lat]);
            hoveredSource.setData(extractedFeature);
            setTitleAndSubtitle(extractedFeature);
        }
    });

    interactiveGroups.events.on('click', async (feature, lngLat) => {
        clickedFeature = findClosestLineString(feature, [lngLat.lng, lngLat.lat]);
        hoveredSource.setData(clickedFeature);
        selectedSource.setData(createInvertedBuffer(clickedFeature, pxToMeters(15, mapLibreMap), 'meters'));
        setTitleAndSubtitle(clickedFeature);

        if (clickedFeature.geometry.type == 'LineString') {
            const coordinates = clickedFeature.geometry.coordinates;
            showRevGeoResponses(
                await Promise.all([
                    reverseGeocode({ position: coordinates[0] }),
                    reverseGeocode({ position: coordinates.at(-1) as Position }),
                ]),
            );
        } else if (clickedFeature.geometry.type == 'Point') {
            showRevGeoResponses([
                await reverseGeocode({
                    position: clickedFeature.geometry.coordinates,
                    number: String(clickedFeature.properties.number),
                }),
            ]);
        } else {
            addressesElement.innerHTML = '';
        }
    });

    const setPlaceholderText = () => {
        titleElement.innerHTML = 'Explore roads, streets, ferries and house numbers...';
        subtitleElement.innerHTML = '';
        addressesElement.innerHTML = '';
    };

    const emptyFeatureCollection: FeatureCollection = { type: 'FeatureCollection', features: [] };

    restOfTheMap.events.on('hover', () => {
        if (!clickedFeature) {
            hoveredSource.setData(emptyFeatureCollection);
            setPlaceholderText();
        }
    });

    restOfTheMap.events.on('click', () => {
        clickedFeature = undefined;
        hoveredSource.setData(emptyFeatureCollection);
        selectedSource.setData(emptyFeatureCollection);
        setPlaceholderText();
    });
})();
