/**
 * Maximum execution times in Milliseconds for performance tests.
 */
export const MAX_EXEC_TIMES_MS = {
    ev: {
        schemaValidation: 1,
        requestBuilding: 1,
        responseParsing: 1,
    },
    geocoding: {
        schemaValidation: 7,
        requestBuilding: 2,
        responseParsing: 5,
    },
    placeById: {
        schemaValidation: 2,
        requestBuilding: 2,
        responseParsing: 1,
    },
    routing: {
        schemaValidation: 2,
        requestBuilding: 5,
        responseParsing: 50,
    },
    revGeo: {
        schemaValidation: 5,
        requestBuilding: 3,
        responseParsing: 8,
    },
    search: {
        fuzzySearch: {
            schemaValidation: 5,
            requestBuilding: 2,
            responseParsing: 5,
        },
        geometrySearch: {
            schemaValidation: 18,
            requestBuilding: 2,
            responseParsing: 5,
        },
    },
    autocomplete: {
        schemaValidation: 1,
        requestBuilding: 1,
        responseParsing: 1,
    },
};
