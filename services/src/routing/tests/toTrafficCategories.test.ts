import { describe, expect, test } from 'vitest';
import { toTrafficCategories } from '../responseParser';
import type { SectionAPI } from '../types/apiResponseTypes';

describe('toTrafficCategories', () => {
    describe('TEC causes mapping', () => {
        test('should map TEC mainCauseCode 1 to jam', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 1 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['jam']);
        });

        test('should map TEC mainCauseCode 2 to accident', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 2 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['accident']);
        });

        test('should map TEC mainCauseCode 3 to roadworks', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 3 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['roadworks']);
        });

        test('should map TEC mainCauseCode 4 to narrow-lanes', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 4 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['narrow-lanes']);
        });

        test('should map TEC mainCauseCode 5 to road-closed', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 5 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['road-closed']);
        });

        test('should map TEC mainCauseCode 9 to danger', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 9 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['danger']);
        });

        test('should map TEC mainCauseCode 11 to animals-on-road', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 11 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['animals-on-road']);
        });

        test('should map TEC mainCauseCode 13 to broken-down-vehicle', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 13 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['broken-down-vehicle']);
        });

        test('should map TEC mainCauseCode 16 to lane-closed', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 16 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['lane-closed']);
        });

        test('should map TEC mainCauseCode 17 to wind', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 17 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['wind']);
        });

        test('should map TEC mainCauseCode 18 to fog', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 18 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['fog']);
        });

        test('should map TEC mainCauseCode 19 to rain', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 19 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['rain']);
        });

        test('should map TEC mainCauseCode 22 to frost', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 22 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['frost']);
        });

        test('should map TEC mainCauseCode 23 to flooding', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 23 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['flooding']);
        });

        test('should map unknown TEC mainCauseCode 0 to other', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 0 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['other']);
        });

        test('should map unknown TEC mainCauseCode 6 to other', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 6 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['other']);
        });

        test('should map unknown TEC mainCauseCode 100 to other', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: { causes: [{ mainCauseCode: 100 }], effectCode: 1 },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['other']);
        });

        test('should map multiple TEC causes', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: {
                    causes: [{ mainCauseCode: 4 }, { mainCauseCode: 3 }],
                    effectCode: 1,
                },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['narrow-lanes', 'roadworks']);
        });

        test('should map multiple TEC causes with mixed known and unknown codes', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: {
                    causes: [{ mainCauseCode: 1 }, { mainCauseCode: 999 }, { mainCauseCode: 2 }],
                    effectCode: 1,
                },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['jam', 'other', 'accident']);
        });
    });

    describe('simpleCategory fallback', () => {
        test('should map simpleCategory JAM to jam', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                simpleCategory: 'JAM',
            };

            expect(toTrafficCategories(apiSection)).toEqual(['jam']);
        });

        test('should map simpleCategory ROAD_WORK to roadworks', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                simpleCategory: 'ROAD_WORK',
            };

            expect(toTrafficCategories(apiSection)).toEqual(['roadworks']);
        });

        test('should map simpleCategory ROAD_CLOSURE to road-closed', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                simpleCategory: 'ROAD_CLOSURE',
            };

            expect(toTrafficCategories(apiSection)).toEqual(['road-closed']);
        });

        test('should map simpleCategory OTHER to other', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                simpleCategory: 'OTHER',
            };

            expect(toTrafficCategories(apiSection)).toEqual(['other']);
        });

        test('should default to other when simpleCategory is undefined', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
            };

            expect(toTrafficCategories(apiSection)).toEqual(['other']);
        });
    });

    describe('TEC takes precedence over simpleCategory', () => {
        test('should use TEC causes when both TEC and simpleCategory are present', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: {
                    causes: [{ mainCauseCode: 2 }],
                    effectCode: 1,
                },
                simpleCategory: 'JAM',
            };

            // Should use TEC (accident) not simpleCategory (jam)
            expect(toTrafficCategories(apiSection)).toEqual(['accident']);
        });

        test('should use TEC causes with multiple causes when both TEC and simpleCategory are present', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: {
                    causes: [{ mainCauseCode: 17 }, { mainCauseCode: 18 }],
                    effectCode: 1,
                },
                simpleCategory: 'ROAD_CLOSURE',
            };

            // Should use TEC (wind, fog) not simpleCategory (road-closed)
            expect(toTrafficCategories(apiSection)).toEqual(['wind', 'fog']);
        });
    });

    describe('edge cases', () => {
        test('should handle section with no TEC and no simpleCategory', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
            };

            expect(toTrafficCategories(apiSection)).toEqual(['other']);
        });

        test('should handle TEC with undefined causes and fallback to simpleCategory', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 0,
                endPointIndex: 10,
                sectionType: 'TRAFFIC',
                tec: {
                    effectCode: 1,
                },
                simpleCategory: 'ROAD_WORK',
            };

            expect(toTrafficCategories(apiSection)).toEqual(['roadworks']);
        });
    });

    describe('real-world scenarios', () => {
        test('should handle traffic jam with TEC', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 90,
                endPointIndex: 103,
                sectionType: 'TRAFFIC',
                tec: {
                    causes: [{ mainCauseCode: 1 }],
                    effectCode: 6,
                },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['jam']);
        });

        test('should handle roadworks with narrow lanes', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 1488,
                endPointIndex: 1519,
                sectionType: 'TRAFFIC',
                tec: {
                    causes: [{ mainCauseCode: 4 }, { mainCauseCode: 3 }],
                    effectCode: 1,
                },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['narrow-lanes', 'roadworks']);
        });

        test('should handle weather-related incidents', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 100,
                endPointIndex: 200,
                sectionType: 'TRAFFIC',
                tec: {
                    causes: [{ mainCauseCode: 19 }, { mainCauseCode: 18 }],
                    effectCode: 4,
                },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['rain', 'fog']);
        });

        test('should handle road closure incident', () => {
            const apiSection: SectionAPI = {
                startPointIndex: 50,
                endPointIndex: 75,
                sectionType: 'TRAFFIC',
                tec: {
                    causes: [{ mainCauseCode: 5 }],
                    effectCode: 8,
                },
            };

            expect(toTrafficCategories(apiSection)).toEqual(['road-closed']);
        });
    });
});
