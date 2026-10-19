import type { CommonPlaceProps, Places } from '@tomtom-org/maps-sdk/core';

export type Store = CommonPlaceProps & { name: string };

// The branches of Korenbloem, a fictional bakery chain in Amsterdam.
export const stores: Places<Store> = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            id: 'jordaan',
            geometry: { type: 'Point', coordinates: [4.8831, 52.37851] },
            properties: {
                type: 'POI',
                name: 'Jordaan',
                address: { freeformAddress: 'Westerstraat 120, 1015 MP Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'de-pijp',
            geometry: { type: 'Point', coordinates: [4.89023, 52.35549] },
            properties: {
                type: 'POI',
                name: 'De Pijp',
                address: { freeformAddress: 'Ferdinand Bolstraat 60B, 1072 LM Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'oud-west',
            geometry: { type: 'Point', coordinates: [4.86871, 52.36642] },
            properties: {
                type: 'POI',
                name: 'Oud-West',
                address: { freeformAddress: 'Kinkerstraat 150, 1053 GE Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'oosterpark',
            geometry: { type: 'Point', coordinates: [4.92671, 52.35737] },
            properties: {
                type: 'POI',
                name: 'Oosterpark',
                address: { freeformAddress: 'Linnaeusstraat 50, 1092 CM Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'centrum',
            geometry: { type: 'Point', coordinates: [4.89631, 52.37669] },
            properties: {
                type: 'POI',
                name: 'Centrum',
                address: { freeformAddress: 'Nieuwendijk 100, 1012 MR Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'plantage',
            geometry: { type: 'Point', coordinates: [4.91182, 52.3662] },
            properties: {
                type: 'POI',
                name: 'Plantage',
                address: { freeformAddress: 'Plantage Middenlaan 30, 1018 DG Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'rivierenbuurt',
            geometry: { type: 'Point', coordinates: [4.90556, 52.34464] },
            properties: {
                type: 'POI',
                name: 'Rivierenbuurt',
                address: { freeformAddress: 'Rijnstraat 100, 1079 HM Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'noord',
            geometry: { type: 'Point', coordinates: [4.90957, 52.38835] },
            properties: {
                type: 'POI',
                name: 'Noord',
                address: { freeformAddress: 'Van der Pekstraat 50, 1031 EC Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'spaarndammerbuurt',
            geometry: { type: 'Point', coordinates: [4.88106, 52.38761] },
            properties: {
                type: 'POI',
                name: 'Spaarndammerbuurt',
                address: { freeformAddress: 'Spaarndammerstraat 50, 1013 SX Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'zuid',
            geometry: { type: 'Point', coordinates: [4.87686, 52.34858] },
            properties: {
                type: 'POI',
                name: 'Zuid',
                address: { freeformAddress: 'Beethovenstraat 50, 1077 JK Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'museumkwartier',
            geometry: { type: 'Point', coordinates: [4.87114, 52.35501] },
            properties: {
                type: 'POI',
                name: 'Museumkwartier',
                address: { freeformAddress: 'Cornelis Schuytstraat 30, 1071 JJ Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'bos-en-lommer',
            geometry: { type: 'Point', coordinates: [4.85462, 52.38096] },
            properties: {
                type: 'POI',
                name: 'Bos en Lommer',
                address: { freeformAddress: 'Bos en Lommerweg 150, 1055 EE Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'watergraafsmeer',
            geometry: { type: 'Point', coordinates: [4.93074, 52.35333] },
            properties: {
                type: 'POI',
                name: 'Watergraafsmeer',
                address: { freeformAddress: 'Middenweg 60D, 1097 BR Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'ijburg',
            geometry: { type: 'Point', coordinates: [4.98865, 52.35843] },
            properties: {
                type: 'POI',
                name: 'IJburg',
                address: { freeformAddress: 'IJburglaan 500, 1087 BT Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'slotervaart',
            geometry: { type: 'Point', coordinates: [4.82684, 52.362] },
            properties: {
                type: 'POI',
                name: 'Slotervaart',
                address: { freeformAddress: 'Johan Huizingalaan 100, 1065 JE Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'indische-buurt',
            geometry: { type: 'Point', coordinates: [4.93414, 52.36357] },
            properties: {
                type: 'POI',
                name: 'Indische Buurt',
                address: { freeformAddress: 'Javastraat 60, 1094 HK Amsterdam' },
            },
        },
        {
            type: 'Feature',
            id: 'haarlemmerbuurt',
            geometry: { type: 'Point', coordinates: [4.88676, 52.38309] },
            properties: {
                type: 'POI',
                name: 'Haarlemmerbuurt',
                address: { freeformAddress: 'Haarlemmerdijk 100E, 1013 JG Amsterdam' },
            },
        },
    ],
};
