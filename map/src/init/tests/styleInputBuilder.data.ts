import type { StyleSpecification } from 'maplibre-gl';
import type { TomTomMapParams } from '../types/mapInit';

type StyleInputBuilderTestCase = [
    testName: string,
    inputParams: TomTomMapParams,
    expectedOutput: string | StyleSpecification,
];

/**
 * Test data for styleInputBuilder tests.
 * Each entry is a tuple containing:
 * - Test case description
 * - Input TomTomMapParams
 * - Expected output (either a URL string or StyleSpecification object)
 */
export const mapsSdkInitParamsAndMapStyles: StyleInputBuilderTestCase[] = [
    [
        'Standard light standard style ID',
        {
            commonBaseURL: 'https://api.tomtom.com',
            apiKey: 'TEST_API_KEY',
            style: 'standardLight',
        } as TomTomMapParams,
        'https://api.tomtom.com/maps/orbis/assets/styles/0.6.0-0/style.json?apiVersion=1&key=TEST_API_KEY&map=basic_street-light&trafficIncidents=incidents_light&trafficFlow=flow_relative-light&hillshade=hillshade_light',
    ],
    [
        'Standard dark standard style ID',
        {
            commonBaseURL: 'https://api.tomtom.com',
            apiKey: 'TEST_API_KEY',
            style: 'standardDark',
        } as TomTomMapParams,
        'https://api.tomtom.com/maps/orbis/assets/styles/0.6.0-0/style.json?apiVersion=1&key=TEST_API_KEY&map=basic_street-dark&trafficIncidents=incidents_dark&trafficFlow=flow_relative-dark&hillshade=hillshade_dark',
    ],
    [
        'Driving light standard style ID',
        {
            commonBaseURL: 'https://api.tomtom.com',
            apiKey: 'TEST_API_KEY',
            style: 'drivingLight',
        } as TomTomMapParams,
        'https://api.tomtom.com/maps/orbis/assets/styles/0.6.0-0/style.json?apiVersion=1&key=TEST_API_KEY&map=basic_street-light-driving&trafficIncidents=incidents_light&trafficFlow=flow_relative-light&hillshade=hillshade_light',
    ],
    [
        'Driving dark standard style ID',
        {
            commonBaseURL: 'https://api.tomtom.com',
            apiKey: 'TEST_API_KEY',
            style: 'drivingDark',
        } as TomTomMapParams,
        'https://api.tomtom.com/maps/orbis/assets/styles/0.6.0-0/style.json?apiVersion=1&key=TEST_API_KEY&map=basic_street-dark-driving&trafficIncidents=incidents_dark&trafficFlow=flow_relative-dark&hillshade=hillshade_dark',
    ],
    [
        'Mono light standard style ID',
        {
            commonBaseURL: 'https://api.tomtom.com',
            apiKey: 'TEST_API_KEY',
            style: 'monoLight',
        } as TomTomMapParams,
        'https://api.tomtom.com/maps/orbis/assets/styles/0.6.0-0/style.json?apiVersion=1&key=TEST_API_KEY&map=basic_mono-light&trafficIncidents=incidents_light&trafficFlow=flow_relative-light&hillshade=hillshade_mono-light',
    ],
    [
        'Mono dark standard style ID',
        {
            commonBaseURL: 'https://api.tomtom.com',
            apiKey: 'TEST_API_KEY',
            style: 'monoDark',
        } as TomTomMapParams,
        'https://api.tomtom.com/maps/orbis/assets/styles/0.6.0-0/style.json?apiVersion=1&key=TEST_API_KEY&map=basic_mono-dark&trafficIncidents=incidents_dark&trafficFlow=flow_relative-dark&hillshade=hillshade_mono-dark',
    ],
    [
        'Satellite standard style ID',
        {
            commonBaseURL: 'https://api.tomtom.com',
            apiKey: 'TEST_API_KEY',
            style: 'satellite',
        } as TomTomMapParams,
        'https://api.tomtom.com/maps/orbis/assets/styles/0.6.0-0/style.json?apiVersion=1&key=TEST_API_KEY&map=basic_street-satellite&trafficIncidents=incidents_light&trafficFlow=flow_relative-light&hillshade=hillshade_satellite',
    ],
    [
        'Standard light standard style ID with version',
        {
            commonBaseURL: 'https://api.tomtom.com',
            apiKey: 'TEST_API_KEY',
            style: {
                type: 'standard',
                id: 'standardLight',
                version: 'TEST_VERSION',
            },
        } as TomTomMapParams,
        'https://api.tomtom.com/maps/orbis/assets/styles/TEST_VERSION/style.json?apiVersion=1&key=TEST_API_KEY&map=basic_street-light&trafficIncidents=incidents_light&trafficFlow=flow_relative-light&hillshade=hillshade_light',
    ],
    [
        'Mono light standard style ID with version',
        {
            commonBaseURL: 'https://api.tomtom.com',
            apiKey: 'TEST_API_KEY',
            style: {
                type: 'standard',
                id: 'monoLight',
                version: 'TEST_VERSION',
            },
        } as TomTomMapParams,
        'https://api.tomtom.com/maps/orbis/assets/styles/TEST_VERSION/style.json?apiVersion=1&key=TEST_API_KEY&map=basic_mono-light&trafficIncidents=incidents_light&trafficFlow=flow_relative-light&hillshade=hillshade_mono-light',
    ],
    [
        'Given style URL',
        {
            commonBaseURL: 'https://api.tomtom.com',
            apiKey: 'TEST_API_KEY',
            style: {
                type: 'custom',
                url: 'https://api-test.tomtom.com/randomurl/bla/bla',
            },
        } as TomTomMapParams,
        'https://api-test.tomtom.com/randomurl/bla/bla?key=TEST_API_KEY',
    ],
    [
        'Given style URL with its own API key',
        {
            apiKey: 'TEST_API_KEY',
            style: {
                type: 'custom',
                url: 'https://api-test.tomtom.com/randomurl/bla/bla?key=CUSTOM_API_KEY',
            },
        } as TomTomMapParams,
        'https://api-test.tomtom.com/randomurl/bla/bla?key=CUSTOM_API_KEY',
    ],
    [
        'Given style JSON',
        {
            apiKey: 'TEST_API_KEY',
            style: {
                type: 'custom',
                json: {
                    sources: ['bar', 'foo'],
                    layers: [1, 2, 3, 4],
                } as unknown as StyleSpecification,
            },
        } as TomTomMapParams,
        {
            sources: ['bar', 'foo'],
            layers: [1, 2, 3, 4],
        } as unknown as StyleSpecification,
    ],
    [
        'Standard style with module inclusion dark',
        {
            commonBaseURL: 'https://api.tomtom.com',
            apiKey: 'TEST_API_KEY',
            style: {
                type: 'standard',
                id: 'standardDark',
                include: ['trafficIncidents', 'trafficFlow', 'hillshade'],
            },
        } as TomTomMapParams,
        'https://api.tomtom.com/maps/orbis/assets/styles/0.6.0-0/style.json?apiVersion=1&key=TEST_API_KEY&map=basic_street-dark&trafficIncidents=incidents_dark&trafficFlow=flow_relative-dark&hillshade=hillshade_dark',
    ],
    [
        'Standard style with module inclusion light',
        {
            commonBaseURL: 'https://api.tomtom.com',
            apiKey: 'TEST_API_KEY',
            style: {
                type: 'standard',
                id: 'standardLight',
                include: ['trafficIncidents', 'trafficFlow', 'hillshade'],
            },
        } as TomTomMapParams,
        'https://api.tomtom.com/maps/orbis/assets/styles/0.6.0-0/style.json?apiVersion=1&key=TEST_API_KEY&map=basic_street-light&trafficIncidents=incidents_light&trafficFlow=flow_relative-light&hillshade=hillshade_light',
    ],
];

export default mapsSdkInitParamsAndMapStyles;
