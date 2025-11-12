import type { MapLibreOptions, TomTomMapParams } from 'map';

export type ExpectLayers = {
    incidents: boolean;
    flow: boolean;
    hillshade: boolean;
};

type MapInitProps = [
    description: string,
    mapLibreOptions: Partial<MapLibreOptions>,
    tomtomParams: Partial<TomTomMapParams>,
    expectLayers: ExpectLayers,
];

export const mapInitTestData: MapInitProps[] = [
    ['All defaults', {}, {}, { incidents: true, flow: true, hillshade: true }],
    ['Standard dark', {}, { style: 'standardDark' }, { incidents: true, flow: true, hillshade: true }],
    ['Driving light', {}, { style: 'drivingLight' }, { incidents: true, flow: true, hillshade: true }],
    ['Mono light', {}, { style: 'monoLight' }, { incidents: true, flow: true, hillshade: true }],
    ['Mono dark', {}, { style: 'monoDark' }, { incidents: true, flow: true, hillshade: true }],
    ['Satellite', {}, { style: 'satellite' }, { incidents: true, flow: true, hillshade: true }],
    [
        'Defaults with style object input, yet no added parts',
        {},
        { style: { type: 'standard' } },
        { incidents: true, flow: true, hillshade: true },
    ],
    [
        'Defaults with traffic incidents',
        {},
        {
            style: {
                type: 'standard',
                include: ['trafficIncidents'],
            },
        },
        { incidents: true, flow: false, hillshade: false },
    ],
    [
        'Defaults with traffic flow',
        {},
        {
            style: {
                type: 'standard',
                include: ['trafficFlow'],
            },
        },
        { incidents: false, flow: true, hillshade: false },
    ],
    [
        'Defaults with hillshade',
        {},
        {
            style: {
                type: 'standard',
                include: ['hillshade'],
            },
        },
        { incidents: false, flow: false, hillshade: true },
    ],
    [
        'Defaults with more included parts',
        {},
        {
            style: {
                type: 'standard',
                include: ['trafficIncidents', 'trafficFlow', 'hillshade'],
            },
        },
        { incidents: true, flow: true, hillshade: true },
    ],
    [
        'Dark map, basic, zoomed',
        { zoom: 6 },
        { style: 'standardDark' },
        { incidents: true, flow: true, hillshade: true },
    ],
    [
        'Dark map, with included parts',
        { zoom: 6, center: [-0.12621, 51.50394] },
        {
            style: {
                type: 'standard',
                id: 'standardDark',
                include: ['trafficIncidents', 'trafficFlow', 'hillshade'],
            },
        },
        { incidents: true, flow: true, hillshade: true },
    ],
    [
        'Mono light map, basic',
        { zoom: 14, minZoom: 2 },
        { style: 'monoLight' },
        { incidents: true, flow: true, hillshade: true },
    ],
    [
        'Mono light map, with included parts',
        { zoom: 14, minZoom: 2, center: [-0.12621, 51.50394] },
        {
            style: {
                type: 'standard',
                id: 'monoLight',
                include: ['trafficIncidents', 'trafficFlow', 'hillshade'],
            },
        },
        { incidents: true, flow: true, hillshade: true },
    ],
    [
        'Mono dark map, basic',
        { zoom: 14, minZoom: 2, center: [-0.12621, 51.50394] },
        { style: 'monoDark' },
        { incidents: true, flow: true, hillshade: true },
    ],
    [
        'Mono dark map, with included parts',
        { zoom: 14, minZoom: 2, center: [-0.12621, 51.50394] },
        {
            style: {
                type: 'standard',
                id: 'monoDark',
                include: ['trafficIncidents', 'hillshade'],
            },
        },
        { incidents: true, flow: false, hillshade: true },
    ],
    [
        'Satellite map, basic',
        { zoom: 12, minZoom: 2, center: [-0.12621, 51.50394] },
        { style: 'satellite' },
        { incidents: true, flow: true, hillshade: true },
    ],
    [
        'Satellite map, with hillshade',
        { zoom: 10, minZoom: 2, center: [-0.12621, 51.50394] },
        {
            style: {
                type: 'standard',
                id: 'satellite',
                include: ['hillshade'],
            },
        },
        { incidents: false, flow: false, hillshade: true },
    ],
    [
        'Satellite map, with more included parts',
        { zoom: 12, minZoom: 2, center: [-0.12621, 51.50394] },
        {
            style: {
                type: 'standard',
                id: 'satellite',
                include: ['trafficIncidents', 'trafficFlow', 'hillshade'],
            },
        },
        { incidents: true, flow: true, hillshade: true },
    ],
];
