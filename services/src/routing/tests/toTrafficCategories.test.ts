import { describe, expect, test } from 'vitest';
import { toTrafficCategories } from '../responseParser';
import type { IconCategoryAPI, TrafficSectionAPI } from '../types/apiResponseTypes';

describe('toTrafficCategories', () => {
    describe('TEC causes mapping', () => {
        test('should map TEC mainCauseCode 1 to jam', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 1 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['jam']);
        });

        test('should map TEC mainCauseCode 2 to accident', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 2 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['accident']);
        });

        test('should map TEC mainCauseCode 3 to roadworks', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 3 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['roadworks']);
        });

        test('should map TEC mainCauseCode 4 to narrow-lanes', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 4 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['narrow-lanes']);
        });

        test('should map TEC mainCauseCode 5 to road-closed', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 5 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['road-closed']);
        });

        test('should map TEC mainCauseCode 9 to danger', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 9 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['danger']);
        });

        test('should map TEC mainCauseCode 11 to animals-on-road', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 11 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['animals-on-road']);
        });

        test('should map TEC mainCauseCode 13 to broken-down-vehicle', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 13 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['broken-down-vehicle']);
        });

        test('should map TEC mainCauseCode 16 to lane-closed', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 16 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['lane-closed']);
        });

        test('should map TEC mainCauseCode 17 to wind', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 17 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['wind']);
        });

        test('should map TEC mainCauseCode 18 to fog', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 18 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['fog']);
        });

        test('should map TEC mainCauseCode 19 to rain', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 19 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['rain']);
        });

        test('should map TEC mainCauseCode 22 to frost', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 22 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['frost']);
        });

        test('should map TEC mainCauseCode 23 to flooding', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 23 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['flooding']);
        });

        test('should map unknown TEC mainCauseCode to other', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 0 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['other']);
        });

        test('should map multiple TEC causes', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 4 }, { mainCauseCode: 3 }], effectCode: 1 },
            };
            expect(toTrafficCategories(section)).toEqual(['narrow-lanes', 'roadworks']);
        });
    });

    describe('iconCategory fallback (V3)', () => {
        test.each([
            ['jam', ['jam']],
            ['accident', ['accident']],
            ['brokenDownVehicle', ['broken-down-vehicle']],
            ['dangerousConditions', ['danger']],
            ['flooding', ['flooding']],
            ['fog', ['fog']],
            ['ice', ['frost']],
            ['laneClosed', ['lane-closed']],
            ['rain', ['rain']],
            ['roadClosed', ['road-closed']],
            ['roadWorks', ['roadworks']],
            ['wind', ['wind']],
        ])('should map iconCategory %s to %s', (iconCategory, expected) => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                iconCategory: iconCategory as IconCategoryAPI,
            };
            expect(toTrafficCategories(section)).toEqual(expected);
        });

        test('should default to other for unknown iconCategory', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                iconCategory: 'unknown' as IconCategoryAPI,
            };
            expect(toTrafficCategories(section)).toEqual(['other']);
        });

        test('should default to other when no tec and no iconCategory', () => {
            const section: TrafficSectionAPI = { startPathIndex: 0, endPathIndex: 10 };
            expect(toTrafficCategories(section)).toEqual(['other']);
        });

        test('TEC takes precedence over iconCategory', () => {
            const section: TrafficSectionAPI = {
                startPathIndex: 0,
                endPathIndex: 10,
                tec: { causes: [{ mainCauseCode: 2 }], effectCode: 1 },
                iconCategory: 'jam',
            };
            expect(toTrafficCategories(section)).toEqual(['accident']);
        });
    });
});
