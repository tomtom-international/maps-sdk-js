export type Tag = {
    id: string;
    label: string;
};

export type TagGroup = {
    tags: Tag[];
} & Tag;

export const TAG_GROUP: TagGroup[] = [
    {
        id: 'product',
        label: 'Product group',
        tags: [
            {
                id: 'map',
                label: 'Map',
            },
            {
                id: 'places',
                label: 'Places',
            },
            {
                id: 'traffic',
                label: 'Traffic',
            },
        ],
    },
    {
        id: 'feature',
        label: 'Features/Modules',
        tags: [
            {
                id: 'fuzzy-search',
                label: 'Fuzzy search',
            },
            {
                id: 'map-pois',
                label: 'Map POIs',
            },
            {
                id: 'poi-search',
                label: 'POI search',
            },
            {
                id: 'geometry-search',
                label: 'Geometry search',
            },
            {
                id: 'place-geometry',
                label: 'Place geometry',
            },
            {
                id: 'reachable-range',
                label: 'Reachable range',
            },
        ],
    },
    {
        id: 'use-case',
        label: 'Use case/topic',
        tags: [
            {
                id: 'route-planning',
                label: 'Route planning',
            },
            {
                id: 'localization',
                label: 'Localization',
            },
        ],
    },
    {
        id: 'technology',
        label: 'Technology',
        tags: [
            {
                id: 'playground',
                label: 'Playground',
            },
            {
                id: 'web',
                label: 'Web',
            },
            {
                id: 'base-map',
                label: 'Base map',
            },
            {
                id: 'geocoding',
                label: 'Geocoding',
            },
            {
                id: 'map-style',
                label: 'Map style',
            },
            {
                id: 'nodejs',
                label: 'Node.js',
            },
            {
                id: 'rev-geocoding',
                label: 'Reverse geocoding',
            },
            {
                id: 'maplibre-customization',
                label: 'MapLibre customization',
            },
        ],
    },
];
