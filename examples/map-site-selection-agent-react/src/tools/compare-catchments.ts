import type { CommonPlaceProps, PolygonFeature, PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import { geocodeOne } from '@tomtom-org/maps-sdk/services';
import type { ReachableRange, ToolEntry, ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import * as turf from '@turf/turf';
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { z } from 'zod';
import { byodCandidateSites, requireByodFeatures } from '../agent/byod-inputs';
import { resolveCatchment } from '../agent/site-selection-state';
import { startProgress } from '../progress/progress-store';
import { type OverlapPair, pointFeature, publishOverlap } from '../results/results-store';
import { drawRichOverlay, OVERLAP_COLOR, type OverlayLine, positionPolygonLayers } from '../viz/site-visuals';
// Same catchment construction as profileSite/rankSites, so overlap numbers are comparable with them.
import { buildDriveIsochrone, buildWalkCircle, type Catchment, drawCatchment, toPolygonFeature } from './profile-site';

const MAX_EXISTING = 8;

const siteSchema = z.object({
    address: z.string().describe('Site address or place name.'),
    label: z.string().optional().describe('Short display label; defaults to the geocoded address.'),
});

const compareCatchmentsSchema = z.object({
    proposed: siteSchema.describe('The PROPOSED new site whose catchment is checked against the existing ones.'),
    existing: z
        .array(siteSchema)
        .max(MAX_EXISTING)
        .optional()
        .describe(
            'The EXISTING sites the proposed one might cannibalize, by address (1-8). Omit when supplying existingByodEntryId.',
        ),
    existingByodEntryId: z
        .string()
        .optional()
        .describe(
            'Use the features of an already-loaded BYOD layer (from addByodSource) as the existing network — ' +
                "e.g. the customer's own store locations. Each feature becomes one site (a Point as-is, a " +
                'polygon/line by its centroid). Combine with `existing` or use alone.',
        ),
    travelMode: z
        .enum(['walking', 'driving'])
        .optional()
        .describe('Catchment mode applied to every site. Omit to use the session default.'),
    walkReachMeters: z
        .number()
        .positive()
        .optional()
        .describe('Walking-catchment radius in metres. Omit to use the session default.'),
    driveMinutes: z
        .number()
        .positive()
        .optional()
        .describe('Drive-time budget in minutes. Omit to use the session default.'),
});

type CompareCatchmentsInput = z.infer<typeof compareCatchmentsSchema>;
type ResolvedSite = { label: string; position: [number, number]; catchment: Catchment; km2: number };
type PolyFeature = PolygonFeature<CommonPlaceProps>;

const km2Of = (feature: Catchment | PolyFeature): number => Math.round((turf.area(feature) / 1e6) * 100) / 100;
const pct = (part: number, whole: number): number => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);
const asPolygonPair = (a: Catchment, b: Catchment): FeatureCollection<Polygon | MultiPolygon> =>
    ({ type: 'FeatureCollection', features: [a, b] }) as unknown as FeatureCollection<Polygon | MultiPolygon>;

type Catchmenter = { walking: boolean; walkReachMeters: number; driveMinutes: number };

// Build a catchment around an already-resolved position (used for both geocoded addresses and the
// coordinate-carrying Point features of a BYOD network layer).
const buildResolvedSite = async (
    label: string,
    position: [number, number],
    { walking, walkReachMeters, driveMinutes }: Catchmenter,
): Promise<ResolvedSite | null> => {
    try {
        const catchment = walking
            ? buildWalkCircle(position, walkReachMeters)
            : await buildDriveIsochrone(position, driveMinutes);
        return { label, position, catchment, km2: km2Of(catchment) };
    } catch {
        return null;
    }
};

const resolveSite = async (
    site: z.infer<typeof siteSchema>,
    catchmenter: Catchmenter,
): Promise<ResolvedSite | null> => {
    const place = await geocodeOne(site.address).catch(() => null);
    if (!place) return null;
    const position: [number, number] = [place.geometry.coordinates[0], place.geometry.coordinates[1]];
    return buildResolvedSite(
        site.label ?? place.properties.address?.freeformAddress ?? site.address,
        position,
        catchmenter,
    );
};

// Resolve the existing network from the address list and/or a BYOD point layer (capped at MAX_EXISTING).
const resolveExisting = async (
    params: CompareCatchmentsInput,
    state: ToolState,
    catchmenter: Catchmenter,
): Promise<{ existing: ResolvedSite[]; skipped: string[] }> => {
    const existing: ResolvedSite[] = [];
    const skipped: string[] = [];

    for (const site of params.existing ?? []) {
        const resolved = await resolveSite(site, catchmenter);
        if (resolved) existing.push(resolved);
        else skipped.push(site.address);
    }

    if (params.existingByodEntryId) {
        const candidates = byodCandidateSites(requireByodFeatures(state, params.existingByodEntryId));
        for (const candidate of candidates) {
            const resolved = await buildResolvedSite(candidate.label, candidate.position, catchmenter);
            if (resolved) existing.push(resolved);
            else skipped.push(candidate.label);
        }
    }

    // Cap at MAX_EXISTING, but surface the drop rather than silently truncating — a BYOD network layer
    // can carry far more sites than the overlap check compares.
    if (existing.length > MAX_EXISTING) {
        const dropped = existing.length - MAX_EXISTING;
        skipped.push(
            `${dropped} more existing site${dropped === 1 ? '' : 's'} beyond the ${MAX_EXISTING}-site limit (not compared)`,
        );
    }
    return { existing: existing.slice(0, MAX_EXISTING), skipped };
};

export const compareCatchments: ToolEntry = {
    description:
        'Cannibalization check: build the catchment of a PROPOSED site and of 1-8 EXISTING sites, measure the ' +
        'geographic overlap (km² and %) and how much of the proposed catchment the existing network already ' +
        'covers. Draws all catchments, shades the overlaps, and connects the proposed site to each overlapping ' +
        'store with a labelled line. Geographic reach only — never a revenue estimate. Details in the panel.',
    classificationPrompt:
        'Check overlap / cannibalization between a proposed new site and existing own stores — how much of the new ' +
        "catchment is already covered by the current network's reach.",
    inputSchema: compareCatchmentsSchema,
    execute: (async (params: CompareCatchmentsInput, state: ToolState) => {
        const progress = startProgress('compareCatchments', [
            'Geocoding sites',
            'Building catchments',
            'Computing overlaps',
            'Drawing',
        ]);
        try {
            const { walking, walkReachMeters, driveMinutes } = resolveCatchment(state, params);
            const catchmenter = { walking, walkReachMeters, driveMinutes };

            progress.step(0);
            const proposed = await resolveSite(params.proposed, catchmenter);
            if (!proposed) {
                progress.done();
                return { error: `Could not resolve the proposed site "${params.proposed.address}".` };
            }
            progress.step(1);
            const { existing, skipped } = await resolveExisting(params, state, catchmenter);
            if (existing.length === 0) {
                progress.done();
                return {
                    error: 'No existing sites could be resolved. Provide existing addresses or a BYOD layer (existingByodEntryId).',
                };
            }

            progress.step(2);
            const overlapFeatures: PolygonFeature[] = []; // filled overlap polygons drawn on the map
            const connectors: OverlayLine[] = [];
            const pairs: OverlapPair[] = existing.map((site, index) => {
                const existingFeature = pointFeature(site.position, `existing-${index}`, {
                    label: site.label,
                    catchmentKm2: site.km2,
                });
                const intersection = turf.intersect(asPolygonPair(proposed.catchment, site.catchment));
                if (!intersection) {
                    return {
                        existing: existingFeature,
                        overlap: null,
                        overlapKm2: 0,
                        pctOfProposed: 0,
                        pctOfExisting: 0,
                    };
                }
                const overlapKm2 = km2Of(intersection as unknown as PolyFeature);
                const overlapFeature = toPolygonFeature(intersection, `overlap-${index}`, {
                    name: `Overlap with ${site.label} (${overlapKm2} km²)`,
                    color: OVERLAP_COLOR, // pink shared-catchment fill (matches the Cannibalization panel)
                });
                overlapFeatures.push(overlapFeature);
                const pctOfProposed = pct(overlapKm2, proposed.km2);
                connectors.push({
                    from: proposed.position,
                    to: site.position,
                    label: `${pctOfProposed}%`,
                    kind: 'target',
                });
                return {
                    existing: existingFeature,
                    overlap: overlapFeature,
                    overlapKm2,
                    pctOfProposed,
                    pctOfExisting: pct(overlapKm2, site.km2),
                };
            });

            // Union of overlaps → share of the proposed catchment already covered (pairwise %s can
            // double-count where existing catchments overlap each other).
            let sharedKm2 = 0;
            if (overlapFeatures.length === 1) sharedKm2 = pairs.reduce((sum, pair) => sum + pair.overlapKm2, 0);
            else if (overlapFeatures.length > 1) {
                const union = turf.union({
                    type: 'FeatureCollection',
                    features: overlapFeatures,
                } as unknown as FeatureCollection<Polygon | MultiPolygon>);
                sharedKm2 = union ? km2Of(union as unknown as PolyFeature) : 0;
            }

            progress.step(3);
            const budget: ReachableRange['budgets'][number] = walking
                ? { type: 'distanceKM', value: walkReachMeters / 1000 }
                : { type: 'timeMinutes', value: driveMinutes };
            await drawCatchment(
                state,
                `Cannibalization check — ${proposed.label}`,
                [proposed, ...existing].map((site, index) => ({
                    origin: {
                        query: index === 0 ? `PROPOSED: ${site.label}` : `Existing: ${site.label}`,
                        position: site.position,
                    },
                    budgets: [budget],
                    polygon: { type: 'FeatureCollection', features: [site.catchment] } as PolygonFeatures,
                })),
            );

            for (const entry of state.customGeometries.entries.filter(
                (e) => e.provenance.operation === 'catchment-overlap',
            )) {
                await state.customGeometries.removeEntry(entry.id);
            }
            if (overlapFeatures.length > 0) {
                const entryId = await state.customGeometries.addEntry(
                    overlapFeatures,
                    { operation: 'catchment-overlap', sourceIds: [] },
                    `Catchment overlap — ${proposed.label}`,
                );
                await state.customGeometries.showEntry(entryId, 'filled');
                // Pink overlap fill sits beneath the roads, its border below the labels.
                const overlapGeometries = await state.customGeometries.getEntryGeometriesModule(entryId, 'filled');
                positionPolygonLayers(overlapGeometries);
            }
            await drawRichOverlay(state, `Cannibalization — ${proposed.label}`, [], connectors);

            // Rank the panel rows by overlap (highest first) so the RankBadge #1 is the biggest
            // cannibalization risk — matching what the badge means in the shortlist panel, rather than
            // the order the existing sites happened to be passed in.
            const rankedPairs = [...pairs].sort((a, b) => b.pctOfProposed - a.pctOfProposed);

            publishOverlap({
                proposed: pointFeature(proposed.position, proposed.label, {
                    label: proposed.label,
                    catchmentKm2: proposed.km2,
                }),
                proposedCatchment: toPolygonFeature(proposed.catchment, proposed.label),
                basis: walking ? `≈${walkReachMeters} m walk radius per site` : `${driveMinutes}-min drive per site`,
                sharedKm2,
                proposedSharedPct: pct(sharedKm2, proposed.km2),
                pairs: rankedPairs,
            });
            progress.done();
            return {
                ok: true as const,
                panel: 'Cannibalization',
                headline: `Checked ${proposed.label} against ${existing.length} existing site${existing.length === 1 ? '' : 's'}.`,
                hint: 'The overlap figures are in the Cannibalization panel — geographic reach only. Summarise in ONE sentence; do NOT restate the % or km². Refuse any revenue/customer-loss estimate unless the user provides sales data.',
                ...(skipped.length > 0 && { skipped }),
            };
        } catch (error) {
            progress.done();
            return { error: `Catchment comparison failed: ${error instanceof Error ? error.message : String(error)}` };
        }
    }) as ToolEntry['execute'],
    examplePrompts: [
        'Would a new store at Damrak 70 cannibalize my shops at Marnixstraat 250 and Keizersgracht 200?',
        'Compare the catchment of a proposed site with my two existing locations',
        'If I open at Javastraat 10, how much would it overlap with my Dappermarkt and Oosterpark stores?',
        'Check how much of a proposed Westerpark site is already covered by my existing three branches',
    ],
};
