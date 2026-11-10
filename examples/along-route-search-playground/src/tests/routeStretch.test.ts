import type { Route } from '@tomtom-org/maps-sdk/core';
import { describe, expect, it } from 'vitest';
import { routeStretch } from '../routeStretch';

const coordinates: Route['geometry']['coordinates'] = [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
    [6, 0],
    [7, 0],
];

const between = (start: number, end: number) => coordinates.slice(start, end + 1);

const ends = [
    { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
    { pointIndex: 7, distanceInMeters: 100, travelTimeInSeconds: 100 },
];

/** A route whose sections and progress are only what the stretch arithmetic reads. */
const route = (
    sections: Record<string, { startPointIndex: number; endPointIndex: number }[]>,
    progress: Route['properties']['progress'] = ends,
): Route =>
    ({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates },
        properties: { summary: { lengthInMeters: 100 }, sections, progress, index: 0 },
    }) as Route;

const marked = route({}, [
    { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
    { pointIndex: 2, distanceInMeters: 40, travelTimeInSeconds: 40 },
    { pointIndex: 5, distanceInMeters: 80, travelTimeInSeconds: 80 },
    { pointIndex: 7, distanceInMeters: 100, travelTimeInSeconds: 100 },
]);

describe('routeStretch', () => {
    it('searches the whole route when nothing narrower is chosen', () => {
        const whole = routeStretch(route({}), { mode: 'whole' });

        expect(whole.polylines).toEqual([coordinates]);
        expect(whole.summary).toBe('The whole route');
        expect(routeStretch(route({}), { mode: 'sections', filter: 'exclude', sectionTypes: [] }).summary).toBe(
            'The whole route',
        );
    });

    it('merges sections that touch and keeps a gap as two stretches', () => {
        const touching = routeStretch(
            route({
                urban: [
                    { startPointIndex: 0, endPointIndex: 2 },
                    { startPointIndex: 2, endPointIndex: 4 },
                ],
            }),
            {
                mode: 'sections',
                filter: 'include',
                sectionTypes: ['urban'],
            },
        );
        const gapped = routeStretch(
            route({
                urban: [
                    { startPointIndex: 0, endPointIndex: 2 },
                    { startPointIndex: 5, endPointIndex: 7 },
                ],
            }),
            {
                mode: 'sections',
                filter: 'include',
                sectionTypes: ['urban'],
            },
        );

        expect(touching.polylines).toEqual([between(0, 4)]);
        expect(touching.summary).toBe('Built-up, 1 stretch');
        expect(gapped.polylines).toEqual([between(0, 2), between(5, 7)]);
        expect(gapped.summary).toBe('Built-up, 2 stretches');
    });

    it('drops an excluded stretch at either end, or the whole route when the exclusion covers it', () => {
        const atStart = routeStretch(route({ motorway: [{ startPointIndex: 0, endPointIndex: 2 }] }), {
            mode: 'sections',
            filter: 'exclude',
            sectionTypes: ['motorway'],
        });
        const atEnd = routeStretch(route({ tunnel: [{ startPointIndex: 5, endPointIndex: 7 }] }), {
            mode: 'sections',
            filter: 'exclude',
            sectionTypes: ['tunnel'],
        });
        const everything = routeStretch(route({ motorway: [{ startPointIndex: 0, endPointIndex: 7 }] }), {
            mode: 'sections',
            filter: 'exclude',
            sectionTypes: ['motorway'],
        });

        expect(atStart.polylines).toEqual([between(2, 7)]);
        expect(atEnd.polylines).toEqual([between(0, 5)]);
        expect(everything.polylines).toEqual([]);
        expect(everything.summary).toBe('That leaves nothing of the route to search.');
    });

    it('says when the chosen types are missing or none are ticked', () => {
        const missing = routeStretch(route({}), { mode: 'sections', filter: 'include', sectionTypes: ['ferry'] });
        const unticked = routeStretch(route({}), { mode: 'sections', filter: 'include', sectionTypes: [] });

        expect(missing.polylines).toEqual([]);
        expect(missing.summary).toBe('No ferry on this route.');
        expect(unticked.summary).toBe('Tick a section type to search only those stretches.');
    });

    it('treats 0–100% as the whole route, a middle share as that span, and a point as too short', () => {
        const whole = routeStretch(marked, { mode: 'share', fromPercent: 0, toPercent: 100 });
        const middle = routeStretch(marked, { mode: 'share', fromPercent: 80, toPercent: 40 });
        const point = routeStretch(route({}), { mode: 'share', fromPercent: 0, toPercent: 0 });

        expect(whole.summary).toBe('The whole route');
        expect(whole.polylines).toEqual([coordinates]);
        expect(middle.polylines).toEqual([between(2, 5)]);
        expect(middle.summary).toBe('From 40% to 80% of the route');
        expect(point.polylines).toEqual([]);
        expect(point.summary).toBe('That part of the route is too short to search.');
    });

    it('cuts a share between progress entries, not only on the entries themselves', () => {
        const share = routeStretch(route({}), { mode: 'share', fromPercent: 20, toPercent: 80 });

        // Progress is only at the two ends. Equal steps of longitude put 20% past vertex 1 and 80% past vertex 5.
        expect(share.polylines).toEqual([between(1, 6)]);
        expect(share.summary).toBe('From 20% to 80% of the route');
    });
});
