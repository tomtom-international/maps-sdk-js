// TODO: make this driven by SDK itself (do not redefine here)

const TAG_IDS = [
    'map',
    'fuzzy-search',
    'playground',
    'web',
    'map-pois',
    'poi-search',
    'base-map',
    'geometry-search',
    'geocoding',
    'map-style',
    'route-planning',
    'place-geometry',
    'localization',
    'nodejs',
    'rev-geocoding',
    'places',
    'maplibre-customization',
    'reachable-range',
    'traffic',
];
const TAG_GROUP_IDS = ['product', 'feature', 'use-case', 'technology'];

export type TagId = (typeof TAG_IDS)[number];
export type TagGroupId = (typeof TAG_GROUP_IDS)[number];

export const TAG_LABEL: Record<TagId, string> = {
    map: 'Map',
    'fuzzy-search': 'Fuzzy search',
    playground: 'Playground',
    web: 'Web',
    'map-pois': 'Map POIs',
    'poi-search': 'POI search',
    'base-map': 'Base map',
    'geometry-search': 'Geometry search',
    geocoding: 'Geocoding',
    'map-style': 'Map style',
    'route-planning': 'Route planning',
    'place-geometry': 'Place geometry',
    localization: 'Localization',
    nodejs: 'Node.js',
    'rev-geocoding': 'Reverse geocoding',
    places: 'Places',
    'maplibre-customization': 'MapLibre customization',
    'reachable-range': 'Reachable range',
    traffic: 'Traffic',
};

export const TAG_GROUP_LABEL: Record<TagGroupId, string> = {
    product: 'Product group',
    feature: 'Features/Modules',
    'use-case': 'Use case/topic',
    technology: 'Technology',
};

export const TAGS_BY_GROUP: Record<TagGroupId, TagId[]> = {
    product: ['map', 'places', 'traffic'],
    feature: ['fuzzy-search', 'map-pois', 'poi-search', 'geometry-search', 'place-geometry', 'reachable-range'],
    'use-case': ['route-planning', 'localization'],
    technology: [
        'playground',
        'web',
        'base-map',
        'geocoding',
        'map-style',
        'nodejs',
        'rev-geocoding',
        'maplibre-customization',
    ],
};