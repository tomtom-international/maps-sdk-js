export type Tag = {
    id: string;
    label: string;
};

export type TagGroup = {
    tags: Tag[];
} & Tag;

export const TAG_GROUPS: TagGroup[] = [
    {
        id: 'type',
        label: 'Type of Example',
        tags: [
            {
                id: 'getting-started',
                label: 'Getting Started',
            },
            {
                id: 'customization',
                label: 'Customization',
            },
            {
                id: 'playground',
                label: 'Playground',
            },
        ],
    },
    {
        id: 'feature',
        label: 'Feature',
        tags: [
            {
                id: 'base-map',
                label: 'Base Map',
            },
            {
                id: 'map-style',
                label: 'Map Style',
            },
            {
                id: 'places',
                label: 'Places and Search',
            },
            {
                id: 'routing',
                label: 'Routing',
            },
            {
                id: 'traffic',
                label: 'Traffic',
            },
            {
                id: 'ev',
                label: 'Electric Vehicles',
            },
             {
                id: 'geometry',
                label: 'Geometry',
            },
        ],
    },
    {
        id: 'platform',
        label: 'Platform',
        tags: [
            {
                id: 'web',
                label: 'Web',
            },
            {
                id: 'nodejs',
                label: 'Node.js',
            },
        ],
    },
];
