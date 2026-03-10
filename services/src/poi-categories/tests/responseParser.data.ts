import type { POICategoriesResponse, PoiCategoriesResponseAPI } from '../types';

const data: [string, PoiCategoriesResponseAPI, POICategoriesResponse][] = [
    [
        'category with a known ID maps to the enum value',
        {
            poiCategories: [
                {
                    id: 7315,
                    name: 'Restaurant',
                    synonyms: ['Eating Out', 'Dining'],
                    childCategoryIds: [],
                },
            ],
        },
        {
            poiCategories: [
                {
                    code: 'RESTAURANT',
                    name: 'Restaurant',
                    synonyms: ['Eating Out', 'Dining'],
                    childCategoryCodes: [],
                },
            ],
        },
    ],
    [
        'category with synonyms maps correctly',
        {
            poiCategories: [
                {
                    id: 7314,
                    name: 'Hotel or Motel',
                    synonyms: ['Hotel', 'Motel', 'Inn'],
                    childCategoryIds: [],
                },
            ],
        },
        {
            poiCategories: [
                {
                    code: 'HOTEL_MOTEL',
                    name: 'Hotel or Motel',
                    synonyms: ['Hotel', 'Motel', 'Inn'],
                    childCategoryCodes: [],
                },
            ],
        },
    ],
    [
        'child categories: known IDs are included, unknown ones are dropped',
        {
            poiCategories: [
                {
                    id: 7315,
                    name: 'Restaurant',
                    synonyms: [],
                    childCategoryIds: [7314, 99998, 7320],
                },
            ],
        },
        {
            poiCategories: [
                {
                    code: 'RESTAURANT',
                    name: 'Restaurant',
                    synonyms: [],
                    childCategoryCodes: ['HOTEL_MOTEL', 'SPORTS_CENTER'],
                },
            ],
        },
    ],
    [
        'multiple categories are all parsed',
        {
            poiCategories: [
                {
                    id: 7383,
                    name: 'Airport',
                    synonyms: ['Aerodrome', 'Airfield'],
                    childCategoryIds: [],
                },
                {
                    id: 7380,
                    name: 'Railway Station',
                    synonyms: ['Train Station'],
                    childCategoryIds: [],
                },
            ],
        },
        {
            poiCategories: [
                {
                    code: 'AIRPORT',
                    name: 'Airport',
                    synonyms: ['Aerodrome', 'Airfield'],
                    childCategoryCodes: [],
                },
                {
                    code: 'RAILWAY_STATION',
                    name: 'Railway Station',
                    synonyms: ['Train Station'],
                    childCategoryCodes: [],
                },
            ],
        },
    ],
];

export default data;
