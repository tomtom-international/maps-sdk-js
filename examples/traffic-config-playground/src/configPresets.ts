import type { FlowConfig, IncidentsConfig } from '@cet/maps-sdk-js/map';

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
        title: 'Default',
        config: undefined,
    },
    {
        title: 'Incidents',
        config: {
            flow: { visible: false },
        },
    },
    {
        title: 'Icon-less Incidents',
        config: {
            incidents: { icons: { visible: false } },
            flow: { visible: false },
        },
    },
    {
        title: 'Flow',
        config: {
            incidents: { visible: false },
        },
    },
    {
        title: 'Incidents with delays',
        config: {
            incidents: {
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
        title: 'Flow in main roads with major incidents and icon-less road closures',
        config: {
            incidents: {
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
            incidents: {
                visible: false,
            },
            flow: {
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
