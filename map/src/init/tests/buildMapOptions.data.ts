import type { MapOptions } from 'maplibre-gl';
import type { TomTomMapParams } from '../types/mapInit';

type BuildMapOptionsTestCase = [testName: string, tomtomMapParams: TomTomMapParams, expectedMapOptions: MapOptions];

/**
 * Test data for buildMapOptions tests.
 * Each entry is a tuple containing:
 * - Test case description
 * - Input TomTomMapParams
 * - Expected MapOptions output
 */
export const sdkAndRendererInitParams: BuildMapOptionsTestCase[] = [
    [
        'Default map init',
        {
            mapLibre: {
                container: "<div id='map'></div>",
            },
            commonBaseURL: 'https://api-test.tomtom.com',
            apiKey: 'TEST_API_KEY',
        },
        {
            container: "<div id='map'></div>",
            style: 'https://api-test.tomtom.com/maps/orbis/assets/styles/0.6.0-0/style.json?apiVersion=1&key=TEST_API_KEY&map=basic_street-light&trafficIncidents=incidents_light&trafficFlow=flow_relative-light&hillshade=hillshade_light',
            attributionControl: { compact: false },
            cancelPendingTileRequestsWhileZooming: false,
            maxTileCacheZoomLevels: 22,
            validateStyle: false,
        },
    ],
    [
        'Default map init changing some SDK defaults',
        {
            mapLibre: {
                container: "<div id='map'></div>",
                cancelPendingTileRequestsWhileZooming: true,
                maxTileCacheZoomLevels: 10,
                validateStyle: true,
            },
            commonBaseURL: 'https://api-test.tomtom.com',
            apiKey: 'TEST_API_KEY',
        } as TomTomMapParams,
        {
            container: "<div id='map'></div>",
            style: 'https://api-test.tomtom.com/maps/orbis/assets/styles/0.6.0-0/style.json?apiVersion=1&key=TEST_API_KEY&map=basic_street-light&trafficIncidents=incidents_light&trafficFlow=flow_relative-light&hillshade=hillshade_light',
            attributionControl: { compact: false },
            cancelPendingTileRequestsWhileZooming: true,
            maxTileCacheZoomLevels: 10,
            validateStyle: true,
        },
    ],
    [
        'Map init with many params set',
        {
            mapLibre: {
                container: "<div id='map'></div>",
                zoom: 7,
                center: [10, 20],
                minZoom: 2,
                maxZoom: 20,
                bearing: 90,
            },
            commonBaseURL: 'https://api-test.tomtom.com',
            apiKey: 'TEST_API_KEY',
            style: {
                type: 'custom',
                url: 'https://test_url',
            },
        },
        {
            container: "<div id='map'></div>",
            style: 'https://test_url/?key=TEST_API_KEY',
            zoom: 7,
            center: [10, 20],
            minZoom: 2,
            maxZoom: 20,
            bearing: 90,
            attributionControl: { compact: false },
            cancelPendingTileRequestsWhileZooming: false,
            maxTileCacheZoomLevels: 22,
            validateStyle: false,
        },
    ],
    [
        'Map init showing traffic flow & traffic incidents using include options',
        {
            mapLibre: {
                container: "<div id='map'></div>",
            },
            commonBaseURL: 'https://api-test.tomtom.com',
            apiKey: 'TEST_API_KEY',
            style: {
                type: 'standard',
                include: ['trafficFlow', 'trafficIncidents'],
            },
        },
        {
            container: "<div id='map'></div>",
            style: 'https://api-test.tomtom.com/maps/orbis/assets/styles/0.6.0-0/style.json?apiVersion=1&key=TEST_API_KEY&map=basic_street-light&trafficFlow=flow_relative-light&trafficIncidents=incidents_light',
            attributionControl: { compact: false },
            cancelPendingTileRequestsWhileZooming: false,
            maxTileCacheZoomLevels: 22,
            validateStyle: false,
        },
    ],
    [
        'Map init showing poi and hillshade using include options',
        {
            mapLibre: {
                container: "<div id='map'></div>",
            },
            commonBaseURL: 'https://api-test.tomtom.com',
            apiKey: 'TEST_API_KEY',
            style: {
                type: 'standard',
                include: ['hillshade'],
            },
        },
        {
            container: "<div id='map'></div>",
            style: 'https://api-test.tomtom.com/maps/orbis/assets/styles/0.6.0-0/style.json?apiVersion=1&key=TEST_API_KEY&map=basic_street-light&hillshade=hillshade_light',
            attributionControl: { compact: false },
            cancelPendingTileRequestsWhileZooming: false,
            maxTileCacheZoomLevels: 22,
            validateStyle: false,
        },
    ],
];

export default sdkAndRendererInitParams;
