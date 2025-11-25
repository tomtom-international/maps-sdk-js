import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import type { PostObject } from '../../shared';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildGeometrySearchRequest } from '../requestBuilder';
import type { GeometrySearchParams, GeometrySearchPayloadAPI } from '../types';
import geometrySearchReqObjectsAndUrLs from './requestBuilder.data';
import { geometrySearchReqObjects } from './requestBuilderPerf.data';

describe('Calculate Geometry Search request URL building tests', () => {
    test.each(
        geometrySearchReqObjectsAndUrLs,
    )("'%s'", (_name: string, params: GeometrySearchParams, requestData: PostObject<GeometrySearchPayloadAPI>) => {
        // (We use JSON.stringify because of the relation between JSON inputs and Date objects)
        // (We reparse the objects to compare them ignoring the order of properties)
        expect(JSON.parse(JSON.stringify(buildGeometrySearchRequest(params)))).toMatchObject(
            JSON.parse(JSON.stringify(requestData)),
        );
    });

    const expectToThrow = (type: string): void => {
        expect(() =>
            buildGeometrySearchRequest({
                query: 'whatever',
                commonBaseURL: 'https://api.tomtom.com',
                geometries: [{ type, coordinates: [0, 0] } as never],
            }),
        ).toThrow();
    };

    test('Incorrect geometry type supplied', () => {
        expectToThrow('Point');
        expectToThrow('MultiPoint');
        expectToThrow('LineString');
        expectToThrow('MultiLineString');
    });
});

describe('Geometry Search request URL builder performance tests', () => {
    test('Geometry Search request URL builder performance test', () => {
        expect(
            bestExecutionTimeMS(() => buildGeometrySearchRequest(geometrySearchReqObjects as GeometrySearchParams), 10),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.search.geometrySearch.requestBuilding);
    });
});
