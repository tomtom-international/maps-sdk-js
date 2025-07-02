import { apiToGeoJSONBBox, csvLatLngToPosition, positionToCSVLatLon } from '../geometry';

describe('Geometry tests', () => {
    test('API to GeoJSON bounding boxes', () => {
        expect(
            apiToGeoJSONBBox({
                topLeftPoint: {
                    lat: 52.44179,
                    lon: 4.80845,
                },
                btmRightPoint: {
                    lat: 52.44009,
                    lon: 4.81063,
                },
            }),
        ).toStrictEqual([4.80845, 52.44009, 4.81063, 52.44179]);

        expect(
            apiToGeoJSONBBox({
                southWest: '52.44009,4.80845',
                northEast: '52.44179,4.81063',
            }),
        ).toStrictEqual([4.80845, 52.44009, 4.81063, 52.44179]);
    });

    test('CSV Lat Lng to Position and viceversa tests', () => {
        expect(csvLatLngToPosition('50.1, 2.4')).toStrictEqual([2.4, 50.1]);
        expect(positionToCSVLatLon([2.4, 50.1])).toStrictEqual('50.1,2.4');

        expect(csvLatLngToPosition('-50.0000, 2.4')).toStrictEqual([2.4, -50]);
        expect(positionToCSVLatLon([2.4, -50])).toStrictEqual('-50,2.4');

        expect(csvLatLngToPosition('0.0,2.4')).toStrictEqual([2.4, 0]);
        expect(positionToCSVLatLon([2.4, 0])).toStrictEqual('0,2.4');

        expect(csvLatLngToPosition('50.129931231,-92.40')).toStrictEqual([-92.4, 50.129931231]);
        expect(positionToCSVLatLon([-92.4, 50.129931231])).toStrictEqual('50.129931231,-92.4');
    });
});
