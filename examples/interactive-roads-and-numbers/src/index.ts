import { TomTomConfig } from '@cet/maps-sdk-js/core';
import { BaseMapLayerGroupName, BaseMapModule, mapStyleLayerIDs, POIsModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { ReverseGeocodingResponse, reverseGeocode } from '@cet/maps-sdk-js/services';
import bboxPolygon from '@turf/bbox-polygon';
import { buffer } from '@turf/buffer';
import difference from '@turf/difference';
import distance from '@turf/distance';
import { Feature, FeatureCollection, LineString } from 'geojson';
import { GeoJSONSource, Map, MapGeoJSONFeature, PointLike } from 'maplibre-gl';
import '../style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-US' });

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

const initHoveredSourceAndLayers = (mapLibreMap: Map): GeoJSONSource => {
    const hoveredSourceID = 'hovered';
    mapLibreMap.addSource(hoveredSourceID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
    });
    mapLibreMap.addLayer(
        {
            id: 'hoveredLine',
            source: hoveredSourceID,
            type: 'line',
            paint: { 'line-color': 'brown', 'line-dasharray': [2, 1], 'line-width': 2 },
        },
        mapStyleLayerIDs.lowestLabel,
    );
    mapLibreMap.addLayer(
        {
            filter: ['==', ['get', 'category'], 'house'],
            id: 'hoveredPoint',
            source: hoveredSourceID,
            type: 'circle',
            paint: {
                'circle-stroke-color': 'grey',
                'circle-opacity': 0,
                'circle-stroke-width': 1,
                'circle-stroke-opacity': 1,
                'circle-radius': 15,
            },
        },
        mapStyleLayerIDs.lowestLabel,
    );

    return mapLibreMap.getSource(hoveredSourceID) as GeoJSONSource;
};

const initSelectedSourceAndLayers = (mapLibreMap: Map): GeoJSONSource => {
    const selectedSourceID = 'selected';
    mapLibreMap.addSource(selectedSourceID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
    });
    mapLibreMap.addLayer(
        {
            id: 'selectedBackground',
            source: selectedSourceID,
            type: 'fill',
            paint: { 'fill-color': 'black', 'fill-opacity': 0.25 },
        },
        mapStyleLayerIDs.lowestLabel,
    );

    return mapLibreMap.getSource(selectedSourceID) as GeoJSONSource;
};

(async () => {
    const map = new TomTomMap({
        container: 'maps-sdk-js-examples-map-container',
        center: [-74.00332, 40.71732],
        zoom: 18,
    });
    const mapLibreMap = map.mapLibreMap;
    await POIsModule.get(map, { visible: false });

    const interactiveGroupNames: BaseMapLayerGroupName[] = ['roadLines', 'roadLabels', 'roadShields', 'houseNumbers'];
    const interactiveGroups = await BaseMapModule.get(map, {
        layerGroupsFilter: { mode: 'include', names: interactiveGroupNames },
    });
    const other = await BaseMapModule.get(map, {
        layerGroupsFilter: { mode: 'exclude', names: [...interactiveGroupNames, 'placeLabels'] },
    });

    const hoveredSource = initHoveredSourceAndLayers(mapLibreMap);
    const selectedSource = initSelectedSourceAndLayers(mapLibreMap);

    const titleElement = document.querySelector('#maps-sdk-js-examples-title') as Element;
    const subtitleElement = document.querySelector('#maps-sdk-js-examples-subtitle') as Element;
    const addressesElement = document.querySelector('#maps-sdk-js-examples-addresses') as Element;

    const setTitleAndSubtitle = (feature: MapGeoJSONFeature) => {
        titleElement.innerHTML = `${feature.properties.category} ${feature.properties.subcategory ?? ''}`;
        subtitleElement.innerHTML = feature.properties.name ?? '';
    };

    const showRevGeoResponses = (responses: ReverseGeocodingResponse[]) => {
        addressesElement.innerHTML = responses
            .map((response) => response.properties.address.freeformAddress)
            .join('<br>');
    };

    let clickedFeature: MapGeoJSONFeature | undefined;
    interactiveGroups.events.on('hover', (feature) => {
        if (!clickedFeature) {
            hoveredSource.setData(feature);
            setTitleAndSubtitle(feature);
        }
    });

    interactiveGroups.events.on('click', async (feature) => {
        clickedFeature = feature;
        hoveredSource.setData(feature);

        // We only calculate and show the buffer if zoomed close enough for performance:
        if (mapLibreMap.getZoom() > 9) {
            selectedSource.setData(
                difference({
                    type: 'FeatureCollection',
                    features: [
                        bboxPolygon([-180, 90, 180, -90]),
                        buffer(feature, pxToMeters(15, mapLibreMap), { units: 'meters' })!,
                    ],
                }) as Feature,
            );
        }

        setTitleAndSubtitle(feature);

        if (feature.geometry.type == 'MultiLineString') {
            addressesElement.innerHTML = 'Zoom in closer to select a finer segment.';
        } else if (feature.geometry.type == 'LineString') {
            const coordinates = (feature.geometry as LineString).coordinates;
            showRevGeoResponses(
                await Promise.all([
                    await reverseGeocode({ position: coordinates[0] }),
                    await reverseGeocode({ position: coordinates[coordinates.length - 1] }),
                ]),
            );
        } else if (feature.geometry.type == 'Point') {
            showRevGeoResponses([
                await reverseGeocode({
                    position: feature.geometry.coordinates,
                    number: String(feature.properties.number),
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

    other.events.on('hover', () => {
        if (!clickedFeature) {
            hoveredSource.setData(emptyFeatureCollection);
            setPlaceholderText();
        }
    });

    other.events.on('click', () => {
        clickedFeature = undefined;
        hoveredSource.setData(emptyFeatureCollection);
        selectedSource.setData(emptyFeatureCollection);
        setPlaceholderText();
    });

    (window as any).map = map; // This has been done for automation test support
})();
