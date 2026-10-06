import type { GeopoliticalView } from '@tomtom-org/maps-sdk/core';

export type Territory = {
    name: string;
    center: [number, number];
    zoom: number;
    /** The views that redraw it, or that move its address to another country. */
    views: GeopoliticalView[];
    /** A point on land to reverse geocode, where the territory has an address. */
    addressPoint?: [number, number];
};

export const territories: Territory[] = [
    { name: 'Kashmir', center: [75.6, 34.8], zoom: 5.5, views: ['IN', 'PK'], addressPoint: [74.31, 35.92] },
    { name: 'Aksai Chin', center: [79.3, 35.2], zoom: 6.5, views: ['IN', 'PK'] },
    {
        name: 'Arunachal Pradesh',
        center: [94.0, 28.0],
        zoom: 6,
        views: ['IN', 'CN'],
        addressPoint: [93.6, 27.1],
    },
    { name: 'Kalapani', center: [80.9, 30.2], zoom: 9, views: ['IN'] },
    {
        name: 'Western Sahara',
        center: [-12.9, 25.5],
        zoom: 5,
        views: ['MA', 'DZ', 'AE'],
        addressPoint: [-13.2, 27.15],
    },
    { name: 'Golan Heights', center: [35.75, 33.0], zoom: 9, views: ['IL'], addressPoint: [35.77, 33.0] },
    {
        name: 'East Jerusalem and the West Bank',
        center: [35.25, 31.85],
        zoom: 8.5,
        views: ['IL', 'TR'],
        addressPoint: [35.23, 31.78],
    },
    { name: 'Northern Cyprus', center: [33.4, 35.25], zoom: 8, views: ['TR'], addressPoint: [33.36, 35.18] },
    { name: 'Kosovo', center: [20.9, 42.6], zoom: 7.5, views: ['RS'], addressPoint: [21.16, 42.66] },
    { name: 'Crimea', center: [34.1, 45.0], zoom: 6.5, views: ['RU'], addressPoint: [34.1, 44.95] },
    { name: 'Taiwan', center: [121.0, 23.7], zoom: 6.5, views: ['CN'], addressPoint: [121.56, 25.04] },
    {
        name: 'Falkland Islands (Islas Malvinas)',
        center: [-59.5, -51.7],
        zoom: 6.5,
        views: ['AR'],
        addressPoint: [-57.85, -51.69],
    },
    { name: 'Southern Patagonian Ice Field', center: [-73.3, -49.3], zoom: 7.5, views: ['AR', 'CL'] },
    { name: 'Antarctic Peninsula', center: [-62.0, -66.0], zoom: 3.5, views: ['AR', 'CL'] },
    { name: 'Dokdo and the East Sea', center: [131.87, 37.24], zoom: 5, views: ['KR'] },
    { name: 'Paracel Islands', center: [112.0, 16.5], zoom: 6, views: ['VN'] },
    { name: 'Spratly Islands', center: [114.5, 10.0], zoom: 5, views: ['VN', 'PH', 'MY'] },
    { name: 'Persian Gulf (Arabian Gulf)', center: [51.5, 27.0], zoom: 5, views: ['AE'] },
    { name: 'Gulf of Mexico (Gulf of America)', center: [-90.0, 25.0], zoom: 4, views: ['US'] },
];
