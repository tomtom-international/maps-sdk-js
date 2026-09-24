import { describe, expect, test } from 'vitest';
import { fullTrafficIncidentCategories } from '../../types/traffic/incidents';
import { iconToTrafficIncidentCategory, indexedMagnitudes, trafficIncidentToIconCategory } from '../traffic';

describe('trafficIncidentToIconCategory', () => {
    test('assigns every category a distinct code', () => {
        const codes = fullTrafficIncidentCategories.map(trafficIncidentToIconCategory);

        expect(new Set(codes).size).toBe(codes.length);
    });

    test('maps unrecognised categories to 0', () => {
        expect(trafficIncidentToIconCategory('other')).toBe(0);
    });
});

describe('iconToTrafficIncidentCategory', () => {
    test('round-trips every category through its code', () => {
        fullTrafficIncidentCategories.forEach((category) => {
            expect(iconToTrafficIncidentCategory(trafficIncidentToIconCategory(category))).toBe(category);
        });
    });

    test('maps codes outside the documented table to other', () => {
        expect(iconToTrafficIncidentCategory(0)).toBe('other');
        expect(iconToTrafficIncidentCategory(99)).toBe('other');
    });
});

describe('indexedMagnitudes', () => {
    test('orders magnitudes by the API delay code', () => {
        expect(indexedMagnitudes).toEqual(['unknown', 'minor', 'moderate', 'major', 'indefinite']);
    });
});
