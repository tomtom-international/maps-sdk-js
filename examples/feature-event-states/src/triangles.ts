import type { FeatureCollection, Polygon, Position } from 'geojson';

const METERS_PER_DEGREE_OF_LATITUDE = 111_320;

/**
 * Rows of equilateral triangles pointing alternately up and down, so they tile without gaps, numbered
 * row by row from the south-west corner.
 * @param columns Triangles per row.
 */
export const triangleGrid = (
    center: Position,
    columns: number,
    rows: number,
    sideMeters: number,
): FeatureCollection<Polygon> => {
    const [centerLongitude, centerLatitude] = center;
    const height = (sideMeters * Math.sqrt(3)) / 2 / METERS_PER_DEGREE_OF_LATITUDE;
    const side = sideMeters / (METERS_PER_DEGREE_OF_LATITUDE * Math.cos((centerLatitude * Math.PI) / 180));
    const west = centerLongitude - ((columns + 1) * side) / 4;
    const south = centerLatitude - (rows * height) / 2;

    const features: FeatureCollection<Polygon>['features'] = [];
    for (let row = 0; row < rows; row++) {
        const bottom = south + row * height;
        const top = bottom + height;
        for (let column = 0; column < columns; column++) {
            const left = west + (column * side) / 2;
            const middle = left + side / 2;
            const right = left + side;
            const pointsUp = (column + row) % 2 === 0;
            const ring = pointsUp
                ? [
                      [left, bottom],
                      [right, bottom],
                      [middle, top],
                      [left, bottom],
                  ]
                : [
                      [left, top],
                      [middle, bottom],
                      [right, top],
                      [left, top],
                  ];
            features.push({
                type: 'Feature',
                id: row * columns + column,
                properties: {},
                geometry: { type: 'Polygon', coordinates: [ring] },
            });
        }
    }
    return { type: 'FeatureCollection', features };
};
