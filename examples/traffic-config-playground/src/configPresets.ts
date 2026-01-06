import type { FlowConfig, IncidentsConfig } from '@tomtom-org/maps-sdk/map';

/**
 * Traffic configurations for the playground.
 * * The "title"s are for display in the playground UI.
 * * The "config" objects are the ones to pass to the SDK traffic module.
 */
export const configPresets: {
    title: string;
    config: { incidents?: IncidentsConfig; flow?: FlowConfig } | undefined;
}[] = [
    {
        title: 'Everything',
        config: {
            incidents: { visible: true },
            flow: { visible: true },
        },
    },
    {
        title: 'Incidents',
        config: {
            incidents: { visible: true },
            flow: { visible: false },
        },
    },
    {
        title: 'Icon-less Incidents',
        config: {
            incidents: { visible: true, icons: { visible: false } },
            flow: { visible: false },
        },
    },
    {
        title: 'Flow',
        config: {
            incidents: { visible: false },
            flow: { visible: true },
        },
    },
    {
        title: 'Incidents with delays',
        config: {
            incidents: {
                visible: true,
                filters: {
                    any: [
                        {
                            delays: { mustHaveDelay: true },
                        },
                    ],
                },
            },
            flow: { visible: false },
        },
    },
    {
        title: 'Road works and closures',
        config: {
            incidents: {
                visible: true,
                filters: {
                    any: [
                        {
                            incidentCategories: { show: 'only', values: ['road_closed', 'road_works'] },
                        },
                    ],
                },
            },
            flow: { visible: false },
        },
    },
    {
        title: 'Incidents with indefinite or more than 5 min delays',
        config: {
            incidents: {
                visible: true,
                filters: {
                    any: [
                        {
                            delays: { minDelayMinutes: 5 },
                        },
                    ],
                },
            },
            flow: { visible: false },
        },
    },
    {
        title: 'Flow in motorways',
        config: {
            incidents: { visible: false },
            flow: {
                visible: true,
                filters: {
                    any: [
                        {
                            roadCategories: { show: 'only', values: ['motorway'] },
                        },
                    ],
                },
            },
        },
    },
    {
        title: 'Flow in main roads',
        config: {
            incidents: { visible: false },
            flow: {
                visible: true,
                filters: {
                    any: [
                        {
                            roadCategories: { show: 'only', values: ['motorway', 'trunk', 'primary'] },
                        },
                    ],
                },
            },
        },
    },
    {
        title: 'Main roads flow, major incidents, icon-less road closures',
        config: {
            incidents: {
                visible: true,
                filters: {
                    any: [
                        {
                            magnitudes: { show: 'only', values: ['major', 'moderate'] },
                        },
                        {
                            incidentCategories: { show: 'only', values: ['road_closed'] },
                        },
                    ],
                },
                icons: {
                    filters: {
                        any: [
                            {
                                magnitudes: { show: 'only', values: ['major', 'moderate'] },
                                incidentCategories: { show: 'all_except', values: ['road_closed'] },
                            },
                        ],
                    },
                },
            },
            flow: {
                visible: true,
                filters: {
                    any: [
                        {
                            roadCategories: { show: 'only', values: ['motorway', 'trunk', 'primary'] },
                        },
                    ],
                },
            },
        },
    },
    {
        title: 'Flow in streets (when zoomed in close)',
        config: {
            incidents: { visible: false },
            flow: {
                visible: true,
                filters: {
                    any: [
                        {
                            roadCategories: { show: 'only', values: ['street'] },
                        },
                    ],
                },
            },
        },
    },
];
