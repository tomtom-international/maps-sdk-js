import type { CustomGeoJSONLayerSpec, EventState } from '@tomtom-org/maps-sdk/map';

export const noStateColor = '#8a9bb3';

export const stateColors = {
    hover: '#2a5bd7',
    'long-hover': '#8b3fd9',
    'recently-hovered': '#9db8f2',
    click: '#e5202a',
} satisfies Partial<Record<EventState, string>>;

// The SDK writes each feature's event state to `properties.eventState`.
export const triangleLayers: CustomGeoJSONLayerSpec[] = [
    {
        type: 'fill',
        beforeLayerConfig: 'lowestLabel',
        paint: {
            'fill-color': [
                'match',
                ['get', 'eventState'],
                'hover',
                stateColors.hover,
                'long-hover',
                stateColors['long-hover'],
                'recently-hovered',
                stateColors['recently-hovered'],
                ['click', 'contextmenu'],
                stateColors.click,
                noStateColor,
            ],
            'fill-opacity': ['case', ['has', 'eventState'], 0.8, 0.4],
        },
    },
    {
        type: 'line',
        beforeLayerConfig: 'lowestLabel',
        paint: { 'line-color': '#ffffff', 'line-width': 1.5 },
    },
];
