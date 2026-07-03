import { getPosition, type PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import { geocodeOne } from '@tomtom-org/maps-sdk/services';
import type { ReachableRange, ToolEntry, ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import * as turf from '@turf/turf';
import type { FeatureCollection } from 'geojson';
import { z } from 'zod';
import { byodCandidateSites, requireByodFeatures, sumNumericInArea } from '../agent/byod-inputs';
import { type FactorValues, type FactorWeights, type Gate, resolveWeights, scoreSites } from '../agent/scoring';
import { getSitePreferences, resolveCatchment } from '../agent/site-selection-state';
import { countHouseholds, placeInfo, type SearchFeature } from '../demographics/households';
import { scoreColor } from '../panels/panel-ui';
import { playbook } from '../panels/playbook-tokens';
import { startProgress } from '../progress/progress-store';
import { pointCollection, pointFeature, publishRanking, type RankedSiteProps } from '../results/results-store';
import { drawRankedPins, drawRichOverlay, type OverlayLine, type OverlayPoint } from '../viz/site-visuals';
import {
    buildDriveIsochrone,
    buildWalkCircle,
    type Catchment,
    drawCatchment,
    findCompetitors,
    findParking,
    toPolygonFeature,
} from './profile-site';

const MAX_SITES = 50;
// A real walk/drive catchment is always ≥ ~0.5 km²; an empty/degenerate reachable range (e.g. a
// non-drivable origin) comes back near-zero. Below this it's a data failure, not a tiny site.
const MIN_CATCHMENT_KM2 = 0.1;

const rankSitesSchema = z.object({
    concept: z.string().describe('What is being sited, e.g. "coffee shop", "gym". Drives competitor categories.'),
    sites: z
        .array(z.object({ address: z.string(), label: z.string().optional() }))
        .max(MAX_SITES)
        .optional()
        .describe(
            'Candidate sites to compare by address: { address, label? }. Omit when supplying ' +
                'candidatesByodEntryId instead. At least 2 sites total (addresses + BYOD features), max 50.',
        ),
    candidatesByodEntryId: z
        .string()
        .optional()
        .describe(
            'Rank the features of an already-loaded BYOD layer (from addByodSource) as the candidate sites — ' +
                "e.g. the customer's own parcels or addresses. Each feature becomes one site: a Point as-is, a " +
                'polygon/parcel or line by its centroid. Combine with `sites` or use alone.',
        ),
    candidatesLabelProperty: z
        .string()
        .optional()
        .describe(
            'Optional: the string property of the candidates layer to use as each site\'s label (e.g. "name", ' +
                '"spatial_alias"). Pick the human-readable name field from the layer profile addByodSource returned. ' +
                'Omit to auto-detect (common name/label/title keys), which falls back to "Site 1", "Site 2", … when ' +
                'none is found.',
        ),
    demandByodEntryId: z
        .string()
        .optional()
        .describe(
            'Optional BYOD layer (from addByodSource) supplying the Spend power / demand signal: a numeric property ' +
                'is summed over the features inside each catchment (polygon cells are weighted by the share that ' +
                'falls inside). Activates the demand factor, which is otherwise skipped for lack of data.',
        ),
    demandProperty: z
        .string()
        .optional()
        .describe(
            'REQUIRED when demandByodEntryId is set: the numeric property of the demand layer to sum (e.g. ' +
                '"population", "spend", "income"). Pick a genuine measure from the layer profile addByodSource ' +
                'returned — never an id/code.',
        ),
    competitorCategories: z.array(z.string()).optional().describe('Optional competitor categories (terms or codes).'),
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
    includeParking: z.boolean().default(true).describe('Include parking as the Accessibility factor.'),
    weights: z
        .object({
            reach: z.number().min(0),
            demand: z.number().min(0),
            competition: z.number().min(0),
            accessibility: z.number().min(0),
        })
        .partial()
        .optional()
        .describe(
            'Relative weights for the four factors — Reach (households), Spend power (demand layer), ' +
                'Competition (fewer rivals), Accessibility (parking). Omit to use the session-default weights. ' +
                'Factors that do not vary across the set are skipped automatically.',
        ),
    gates: z
        .object({
            maxCompetitors: z.number().int().positive().optional(),
            requireParkingWithinMeters: z.number().positive().optional(),
        })
        .optional()
        .describe(
            'Optional hard requirements that EXCLUDE a site: a competitor ceiling and/or a max distance to parking.',
        ),
});

type RankSitesInput = z.infer<typeof rankSitesSchema>;

type CollectedSite = {
    id: string;
    label: string;
    position: [number, number];
    catchment: Catchment;
    households: number | null;
    competitorCount: number | null;
    nearestCompetitorMeters: number | null;
    nearestCompetitorPosition: [number, number] | null;
    competitorFeatures: SearchFeature[];
    competitorsMatchedBy: string;
    parkingCount: number | null;
    parkingFeatures: SearchFeature[];
    nearestParkingMeters: number | null;
    nearestParkingPosition: [number, number] | null;
    /** Spend-power / demand summed from a BYOD demand layer within the catchment; null when none supplied. */
    demand: number | null;
    /** Set when the catchment couldn't be built — the site is excluded from ranking with this reason. */
    unavailable?: string;
};

const toFactors = (site: CollectedSite): FactorValues => ({
    reach: site.households,
    demand: site.demand, // spend-power from a BYOD demand layer; null (factor skipped) when none supplied
    competition: site.competitorCount === null ? null : -site.competitorCount,
    accessibility: site.nearestParkingMeters === null ? null : -site.nearestParkingMeters,
});

// A candidate resolved to a map position (from a geocoded address or a BYOD point), ready to profile.
type ResolvedCandidate = { label: string; position: [number, number] };

// An optional BYOD layer whose numeric `property` feeds the spend-power/demand factor.
type DemandLayer = { features: FeatureCollection; property: string };

const collectSite = async (
    candidate: ResolvedCandidate,
    index: number,
    options: {
        walking: boolean;
        walkReachMeters: number;
        driveMinutes: number;
        concept: string;
        competitorCategories?: string[];
        includeParking: boolean;
        demandLayer?: DemandLayer;
    },
): Promise<CollectedSite | null> => {
    const { position, label } = candidate;

    let catchment: Catchment | null;
    try {
        catchment = options.walking
            ? buildWalkCircle(position, options.walkReachMeters)
            : await buildDriveIsochrone(position, options.driveMinutes);
    } catch {
        catchment = null;
    }
    if (!catchment) return null;

    // Demand only makes sense over a real catchment, but compute it in both branches so an unavailable
    // site still reports null (not a misleading 0).
    const demandIn = (geometry: Catchment['geometry']): number | null =>
        options.demandLayer
            ? sumNumericInArea(options.demandLayer.features, geometry, options.demandLayer.property).value
            : null;

    // The reachable range can come back empty/degenerate (e.g. a non-drivable origin like a pedestrian
    // zone). Then every count reads 0 and would falsely score as "no rivals" → top rank. Detect the
    // near-zero area and mark the site unavailable so the scorer EXCLUDES it instead.
    if (turf.area(catchment) / 1e6 < MIN_CATCHMENT_KM2) {
        return {
            id: `site-${index}`,
            label,
            position,
            catchment,
            households: null,
            competitorCount: null,
            nearestCompetitorMeters: null,
            nearestCompetitorPosition: null,
            competitorFeatures: [],
            competitorsMatchedBy: '',
            parkingCount: null,
            parkingFeatures: [],
            nearestParkingMeters: null,
            nearestParkingPosition: null,
            demand: null,
            unavailable: `no usable ${options.walking ? 'walking' : 'drive-time'} catchment from this site (the reachable area came back empty)`,
        };
    }

    const households = await countHouseholds(catchment.geometry);
    const competitors = await findCompetitors(catchment, position, options.concept, options.competitorCategories);
    const parking = options.includeParking ? await findParking(catchment, position) : null;

    return {
        id: `site-${index}`,
        label,
        position,
        catchment,
        households: households.count,
        competitorCount: competitors.count,
        nearestCompetitorMeters: competitors.nearestMeters,
        nearestCompetitorPosition: competitors.nearestPosition,
        competitorFeatures: competitors.features,
        competitorsMatchedBy: competitors.matchedBy,
        parkingCount: parking?.count ?? null,
        parkingFeatures: parking?.features ?? [],
        nearestParkingMeters: parking?.nearestMeters ?? null,
        nearestParkingPosition: parking?.nearestPosition ?? null,
        demand: demandIn(catchment.geometry),
    };
};

// Resolve the candidate sites from the address list and/or a BYOD point layer. Geocoding addresses
// here keeps collectSite position-only (BYOD candidates already carry coordinates).
const resolveCandidates = async (
    params: RankSitesInput,
    state: ToolState,
): Promise<{ candidates: ResolvedCandidate[]; skipped: string[] }> => {
    const candidates: ResolvedCandidate[] = [];
    const skipped: string[] = [];

    for (const site of params.sites ?? []) {
        const place = await geocodeOne(site.address).catch(() => null);
        if (!place) {
            skipped.push(site.address);
            continue;
        }
        candidates.push({
            label: site.label ?? place.properties.address?.freeformAddress ?? site.address,
            position: [place.geometry.coordinates[0], place.geometry.coordinates[1]],
        });
    }

    if (params.candidatesByodEntryId) {
        candidates.push(
            ...byodCandidateSites(
                requireByodFeatures(state, params.candidatesByodEntryId),
                params.candidatesLabelProperty,
            ),
        );
    }

    // Cap at MAX_SITES, but surface the drop rather than silently truncating — a BYOD layer can carry
    // far more points than the model asked to rank.
    if (candidates.length > MAX_SITES) {
        const dropped = candidates.length - MAX_SITES;
        skipped.push(
            `${dropped} more candidate${dropped === 1 ? '' : 's'} beyond the ${MAX_SITES}-site limit (not ranked)`,
        );
    }
    return { candidates: candidates.slice(0, MAX_SITES), skipped };
};

const buildGates = (gates: RankSitesInput['gates']): Gate[] => {
    const out: Gate[] = [];
    if (gates?.maxCompetitors !== undefined) {
        out.push({ factor: 'competition', min: -gates.maxCompetitors, label: `≤ ${gates.maxCompetitors} competitors` });
    }
    if (gates?.requireParkingWithinMeters !== undefined) {
        out.push({
            factor: 'accessibility',
            min: -gates.requireParkingWithinMeters,
            label: `parking within ${gates.requireParkingWithinMeters} m`,
        });
    }
    return out;
};

const confidenceOf = (sites: CollectedSite[]): 'high' | 'medium' | 'low' => {
    const nameMatched = sites.some((site) => site.competitorsMatchedBy.includes('name match'));
    const missingReach = sites.some((site) => site.households === null);
    if (nameMatched || missingReach) return 'low';
    return 'high';
};

// The aggregated map overlay for the whole ranked set: every site's competitor + parking pins, plus a
// connector to each site's nearest competitor and nearest parking (with its distance).
const buildRankedOverlay = (collected: CollectedSite[]): { points: OverlayPoint[]; lines: OverlayLine[] } => {
    const points: OverlayPoint[] = [];
    const lines: OverlayLine[] = [];
    const addPoints = (features: SearchFeature[], kind: OverlayPoint['kind'], fallbackName?: string): void => {
        for (const feature of features) {
            const p = getPosition(feature);
            if (!p) continue;
            const place = placeInfo(feature);
            points.push({ position: [p[0], p[1]], kind, name: place.name || fallbackName, info: place.category });
        }
    };
    const addNearestLine = (
        to: [number, number] | null,
        meters: number | null,
        from: [number, number],
        kind: OverlayLine['kind'],
    ): void => {
        if (to && meters !== null) lines.push({ from, to, label: `${meters} m`, kind });
    };
    for (const site of collected) {
        addPoints(site.competitorFeatures, 'competitor');
        addNearestLine(site.nearestCompetitorPosition, site.nearestCompetitorMeters, site.position, 'competitor');
        addPoints(site.parkingFeatures, 'parking', 'Parking');
        addNearestLine(site.nearestParkingPosition, site.nearestParkingMeters, site.position, 'parking');
    }
    return { points, lines };
};

export const rankSites: ToolEntry = {
    description:
        'Rank 2-50 candidate sites for a concept on a defensible four-factor model — Reach (households), Spend power, ' +
        'Competition, Accessibility (parking) — with a glass-box per-factor score breakdown, optional hard gates, ' +
        'and user weights. Sites come from addresses and/or the features of a loaded BYOD layer ' +
        "(candidatesByodEntryId; polygons/lines are ranked by their centroid) — e.g. rank the customer's own " +
        'parcels. Supply a BYOD demand layer ' +
        '(demandByodEntryId) to score the Spend power factor from your own data. Catchment, weights, and travel mode ' +
        "default to the session preferences when omitted. Draws every site's catchment, competitor pins, and " +
        'nearest-competitor/parking lines; full ranking in the Shortlist panel. Large-format / car-dependent ' +
        'concepts (DIY, furniture, big-box grocery, drive-through) use a driving catchment and a parking gate; ' +
        'small-format pedestrian concepts use a walking catchment.',
    classificationPrompt: 'Compare / rank / shortlist MULTIPLE candidate locations for a new store or site.',
    inputSchema: rankSitesSchema,
    execute: (async (params: RankSitesInput, state: ToolState) => {
        const progress = startProgress('rankSites', [
            'Geocoding sites',
            'Building catchments',
            'Households + competitors',
            'Parking',
            'Scoring',
            'Drawing',
        ]);
        try {
            const { walking, walkReachMeters, driveMinutes } = resolveCatchment(state, params);
            if (params.demandByodEntryId && !params.demandProperty) {
                progress.done();
                return {
                    error: 'demandProperty is required with demandByodEntryId — name the numeric field to sum (e.g. "population"), taken from the layer profile addByodSource returned.',
                };
            }
            const demandLayer: DemandLayer | undefined =
                params.demandByodEntryId && params.demandProperty
                    ? {
                          features: requireByodFeatures(state, params.demandByodEntryId),
                          property: params.demandProperty,
                      }
                    : undefined;
            const options = {
                walking,
                walkReachMeters,
                driveMinutes,
                concept: params.concept,
                competitorCategories: params.competitorCategories,
                includeParking: params.includeParking,
                demandLayer,
            };

            progress.step(0);
            const { candidates, skipped } = await resolveCandidates(params, state);
            if (candidates.length < 2) {
                progress.done();
                return {
                    error: `Need at least 2 candidate sites to rank; resolved ${candidates.length}. Provide more addresses or a BYOD layer (candidatesByodEntryId).`,
                };
            }

            const collected: CollectedSite[] = [];
            for (const candidate of candidates) {
                progress.step(collected.length === 0 ? 1 : 2);
                const result = await collectSite(candidate, collected.length, options);
                if (result) collected.push(result);
                else skipped.push(candidate.label);
            }
            if (collected.length === 0) {
                progress.done();
                return { error: 'None of the sites could be resolved.' };
            }

            progress.step(4);
            const weights: FactorWeights = params.weights
                ? resolveWeights(params.weights)
                : getSitePreferences(state).scoringWeights;
            const gates = buildGates(params.gates);
            const scoreResult = scoreSites(
                collected.map((site) => ({ id: site.id, values: toFactors(site), excluded: site.unavailable })),
                weights,
                gates,
            );
            const byId = new Map(scoreResult.ranked.map((entry, rank) => [entry.id, { entry, rank: rank + 1 }]));

            const rankedSites: (RankedSiteProps & { site: CollectedSite })[] = collected
                .map((site) => {
                    const scored = byId.get(site.id);
                    return {
                        site,
                        rank: scored?.rank ?? 0,
                        label: site.label,
                        score: scored?.entry.score ?? 0,
                        breakdown: scored?.entry.breakdown ?? [],
                        excluded: scored?.entry.excluded,
                        households: site.households,
                        competitorCount: site.competitorCount,
                        nearestCompetitorMeters: site.nearestCompetitorMeters,
                        parkingCount: site.parkingCount,
                        factors: toFactors(site),
                    };
                })
                .sort((a, b) => a.rank - b.rank);

            progress.step(5);
            const budget: ReachableRange['budgets'][number] = walking
                ? { type: 'distanceKM', value: walkReachMeters / 1000 }
                : { type: 'timeMinutes', value: driveMinutes };
            // Catchment + pin reuse the Shortlist widget's score colour, so map and row read as one
            // site (the colour encodes the score band, so repeats across sites are expected).
            const siteColors = rankedSites.map((ranked) =>
                ranked.excluded ? playbook.text.lowEm : scoreColor(ranked.score),
            );
            await drawCatchment(
                state,
                `Ranked sites — ${params.concept}`,
                rankedSites.map((ranked) => ({
                    origin: {
                        query: `#${ranked.rank} ${ranked.label}${ranked.excluded ? ' (excluded)' : ` (${ranked.score})`}`,
                        position: ranked.site.position,
                    },
                    budgets: [budget],
                    polygon: { type: 'FeatureCollection', features: [ranked.site.catchment] } as PolygonFeatures,
                })),
                false, // replaced by drawRankedPins below
                true,
                siteColors,
            );
            drawRankedPins(
                state,
                rankedSites.map((ranked, index) => ({
                    position: ranked.site.position,
                    color: siteColors[index],
                    number: ranked.excluded ? null : ranked.rank,
                })),
            );

            const { points, lines } = buildRankedOverlay(collected);
            await drawRichOverlay(state, `Ranked sites — ${params.concept}`, points, lines);

            publishRanking({
                concept: params.concept,
                mode: walking ? 'walking' : 'driving',
                weights,
                scoredOn: scoreResult.usedFactors,
                skipped: scoreResult.skipped,
                gates: gates.map((gate) => gate.label),
                confidence: confidenceOf(collected),
                competitorsMatchedBy: collected[0]?.competitorsMatchedBy ?? '',
                sites: pointCollection(
                    rankedSites.map(({ site, ...props }) => pointFeature(site.position, site.id, props)),
                ),
                catchments: rankedSites.map(({ site, rank, label }) =>
                    toPolygonFeature(site.catchment, site.id, { rank, label }),
                ),
            });
            progress.done();
            const top = rankedSites.find((ranked) => !ranked.excluded);
            return {
                ok: true as const,
                panel: 'Shortlist',
                headline: `Ranked ${collected.length} sites for ${params.concept}${top ? ` — top: ${top.label}` : ''}.`,
                hint: 'The ranked table with the score breakdown is in the Shortlist panel. Summarise in ONE sentence; do NOT restate the scores or numbers.',
                ...(skipped.length > 0 && { skipped }),
            };
        } catch (error) {
            progress.done();
            return { error: `Site ranking failed: ${error instanceof Error ? error.message : String(error)}` };
        }
    }) as ToolEntry['execute'],
    examplePrompts: [
        'Rank these 3 addresses for a coffee shop: …, …, …',
        'Compare my candidate sites for a gym, weight competition highest',
        'Shortlist the best of these four addresses for a pharmacy, and require parking within 300 m',
        'Which of Damrak 70, Kalverstraat 20 and Leidseplein 5 is the strongest spot for a flagship store?',
    ],
};
