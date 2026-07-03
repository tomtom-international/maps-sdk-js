import {
    type AreaAnalyticsTimedEntry,
    type BBox,
    getPosition,
    type Place,
    type PolygonFeature,
    type PolygonFeatures,
} from '@tomtom-org/maps-sdk/core';
import {
    type BudgetType,
    calculateReachableRange,
    geocodeOne,
    trafficAreaAnalytics,
} from '@tomtom-org/maps-sdk/services';
import type { ReachableRange, ToolEntry, ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { resolvePoiCategories } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import * as turf from '@turf/turf';
import type { Feature, GeoJsonProperties, MultiPolygon, Polygon } from 'geojson';
import { z } from 'zod';
import { resolveCatchment } from '../agent/site-selection-state';
import {
    countHouseholds,
    nearestMeters,
    placeInfo,
    SEARCH_LIMIT,
    type SearchFeature,
    searchInGeometry,
} from '../demographics/households';
import { startProgress } from '../progress/progress-store';
import { type Counted, pointFeature, publishProfile } from '../results/results-store';
import {
    clearRankedPins,
    clearSiteMarker,
    drawRichOverlay,
    drawSiteMarker,
    type OverlayLine,
    type OverlayPoint,
    styleCatchment,
} from '../viz/site-visuals';
import { resolveCategoriesWithNames } from './categories';

// A catchment is a polygon feature; reuse the reachable-range service's feature type for both branches.
export type Catchment = Awaited<ReturnType<typeof calculateReachableRange>>;

// Promote a raw polygon feature (a catchment, an overlap, a clipped hex) to the SDK's PolygonFeature
// shape used across the toolkit state — same geometry, a stable `id`, and the required bbox (computed
// with turf). Lets the result types store catchment/overlap/hex geometry that blends with toolkit state.
export const toPolygonFeature = (
    feature: Feature<Polygon | MultiPolygon>,
    id: string,
    properties: GeoJsonProperties = {},
): PolygonFeature => ({
    type: 'Feature',
    id,
    bbox: turf.bbox(feature) as BBox,
    geometry: feature.geometry,
    properties,
});

// Traffic: analyse a ~1.5 km area around the site over the last ~4 weeks, read weekday peaks.
const TRAFFIC_BUFFER_KM = 1.5;
const TRAFFIC_WINDOW_DAYS = 28;
const WEEKDAYS = [1, 2, 3, 4, 5];
const MORNING_HOURS = [7, 8, 9];
const EVENING_HOURS = [16, 17, 18];

const PARKING_TERMS = ['parking'];

// Broad buckets for the "what kind of place is this?" read.
const AREA_BUCKETS = [
    { key: 'foodDrink', label: 'Food & drink', terms: ['restaurant', 'cafe', 'bar'] },
    { key: 'retail', label: 'Retail', terms: ['shop'] },
    { key: 'office', label: 'Offices', terms: ['office'] },
    { key: 'hotel', label: 'Hotels', terms: ['hotel'] },
    { key: 'transport', label: 'Transport', terms: ['public transport', 'parking'] },
] as const;

const profileSiteSchema = z.object({
    address: z.string().describe('The candidate site address or place name to profile.'),
    concept: z.string().describe('What is being sited, e.g. "coffee shop", "gym". Drives the competitor categories.'),
    competitorCategories: z
        .array(z.string())
        .optional()
        .describe(
            'Optional competitor categories — simple terms ("cafe", "gym") or exact CONSTANT_CASE codes. Omit to ' +
                'derive from the concept. (NL trap: "coffee shop" is the cannabis category COFFEE_SHOP, not cafés.)',
        ),
    travelMode: z
        .enum(['walking', 'driving'])
        .optional()
        .describe(
            'Catchment mode. "walking": straight-line radius. "driving": road-network drive-time area. Omit to use ' +
                'the session default.',
        ),
    walkReachMeters: z
        .number()
        .positive()
        .optional()
        .describe('Walking-catchment radius in metres (≈10-min walk = 800 m). Omit to use the session default.'),
    driveMinutes: z
        .number()
        .positive()
        .optional()
        .describe('Drive-time budget in minutes. Used when driving. Omit to use the session default.'),
    includeParking: z.boolean().default(true).describe('Whether to check nearby parking.'),
});

type ProfileSiteInput = z.infer<typeof profileSiteSchema>;

// Walking catchment = a straight-line radius (pedestrians ignore one-ways). Driving = a real
// road-network drive-time isochrone (car-only service; cars obey one-ways).
export const buildWalkCircle = (position: [number, number], meters: number): Catchment => {
    const circle = turf.buffer(turf.point(position), meters / 1000, { units: 'kilometers' });
    if (!circle) throw new Error('Could not build a walking-radius catchment.');
    return circle as unknown as Catchment;
};

export const buildDriveIsochrone = (position: [number, number], minutes: number): Promise<Catchment> =>
    calculateReachableRange({ origin: position, budget: { type: 'timeMinutes' as BudgetType, value: minutes } });

const positionOf = (feature: SearchFeature): [number, number] | null => {
    const p = getPosition(feature);
    return p ? [p[0], p[1]] : null;
};

// Count POIs matching category terms inside the catchment (search, up to SEARCH_LIMIT).
// null (never 0) when nothing resolves or the search fails. `capped` = count hit the window.
export const countCategory = async (catchment: Catchment, terms: string[]): Promise<Counted> => {
    const { resolved } = await resolvePoiCategories(terms);
    if (!resolved || resolved.length === 0) return { count: null, capped: false };
    const features = await searchInGeometry(catchment.geometry, { poiCategories: resolved, limit: SEARCH_LIMIT });
    return { count: features.length, capped: features.length >= SEARCH_LIMIT };
};

// Competitors inside the catchment, category-first (language-independent), with the full set of
// features (for map pins) + the nearest one (for the connector line) + a readable matchedBy.
export const findCompetitors = async (
    catchment: Catchment,
    sitePosition: [number, number],
    concept: string,
    competitorCategories: string[] | undefined,
) => {
    try {
        const { codes, names } = await resolveCategoriesWithNames(
            competitorCategories?.length ? competitorCategories : [concept],
        );
        const features = await searchInGeometry(catchment.geometry, {
            poiCategories: codes,
            query: concept,
            limit: SEARCH_LIMIT,
        });
        const nearest = nearestMeters(sitePosition, features);
        return {
            features,
            count: features.length,
            capped: features.length >= SEARCH_LIMIT,
            nearestMeters: nearest.meters,
            nearestPosition: nearest.feature ? positionOf(nearest.feature) : null,
            nearestLabel: nearest.feature?.properties?.address?.freeformAddress ?? null,
            matchedBy: codes.length ? `categories: ${names.join(', ')}` : 'name match (no category resolved)',
        };
    } catch {
        return {
            features: [] as SearchFeature[],
            count: null as number | null,
            capped: false,
            nearestMeters: null as number | null,
            nearestPosition: null as [number, number] | null,
            nearestLabel: null as string | null,
            matchedBy: 'search failed',
        };
    }
};

// Parking facilities in the catchment: the full set (for map pins) + the nearest one (for the
// connector line).
export const findParking = async (catchment: Catchment, sitePosition: [number, number]) => {
    const empty = {
        features: [] as SearchFeature[],
        count: null as number | null,
        nearestMeters: null as number | null,
        nearestPosition: null as [number, number] | null,
    };
    try {
        const { resolved } = await resolvePoiCategories(PARKING_TERMS);
        if (!resolved || resolved.length === 0) return empty;
        const features = await searchInGeometry(catchment.geometry, { poiCategories: resolved, limit: SEARCH_LIMIT });
        const nearest = nearestMeters(sitePosition, features);
        return {
            features,
            count: features.length,
            nearestMeters: nearest.meters,
            nearestPosition: nearest.feature ? positionOf(nearest.feature) : null,
        };
    } catch {
        return empty;
    }
};

const findAreaMakeup = async (
    catchment: Catchment,
): Promise<{ key: string; label: string; count: number | null; capped: boolean }[]> =>
    Promise.all(
        AREA_BUCKETS.map(async (bucket) => {
            const counted = await countCategory(catchment, [...bucket.terms]);
            return { key: bucket.key, label: bucket.label, count: counted.count, capped: counted.capped };
        }),
    );

const peakCongestion = (entries: readonly AreaAnalyticsTimedEntry[], hours: number[]): number | null => {
    const relevant = entries.filter(
        (entry) =>
            entry.hour !== undefined &&
            hours.includes(entry.hour) &&
            (entry.day === undefined || WEEKDAYS.includes(entry.day)) &&
            entry.congestionLevel !== undefined,
    );
    if (relevant.length === 0) return null;
    const total = relevant.reduce((sum, entry) => sum + (entry.congestionLevel ?? 0), 0);
    return Math.round(total / relevant.length);
};

const recentDateRange = (): { startDate: string; endDate: string } => {
    const end = new Date();
    const start = new Date(end.getTime() - TRAFFIC_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const format = (date: Date): string => date.toISOString().slice(0, 10);
    return { startDate: format(start), endDate: format(end) };
};

// Traffic profile → a single honest note string (congestion/speeds only; never vehicle counts/mix,
// which TomTom lacks). Degrades to an "unavailable" note (the Area Analytics entitlement gates it).
const trafficNote = async (position: [number, number]): Promise<string> => {
    try {
        const area = turf.buffer(turf.point(position), TRAFFIC_BUFFER_KM, { units: 'kilometers' });
        if (!area) return 'Traffic profile unavailable.';
        const { startDate, endDate } = recentDateRange();
        const result = await trafficAreaAnalytics({
            geometry: area.geometry,
            metrics: 'all',
            functionalRoadClasses: 'all',
            hours: 'all',
            startDate,
            endDate,
        });
        const base = result.features[0]?.properties?.baseData;
        if (!base || (base.congestionLevel === undefined && base.speed === undefined)) {
            return 'Traffic profile unavailable (Traffic Area Analytics is a separate entitlement).';
        }
        const average = result.features[0]?.properties?.timedData?.average ?? [];
        const am = peakCongestion(average, MORNING_HOURS);
        const pm = peakCongestion(average, EVENING_HOURS);
        return `Traffic (≈${TRAFFIC_BUFFER_KM} km, weekday): congestion ${base.congestionLevel ?? '—'}%, AM peak ${am ?? '—'}%, PM peak ${pm ?? '—'}% — congestion/speeds only, no vehicle counts or mix.`;
    } catch {
        return 'Traffic profile unavailable (Traffic Area Analytics is a separate entitlement).';
    }
};

// Draw the catchment polygon + origin pin via the built-in `ranges` slice; replaces prior catchments.
// `showOriginPin` defaults to true (multi-site compare/rank want a labelled pin per origin); profileSite
// passes false and instead draws the Figma pin + address label itself (drawSiteMarker), so the single
// site doesn't get two stacked pins/labels. `drawGeometry` defaults to true (the SDK 'outline' theme);
// profileSite passes false and renders the catchment itself (drawRichOverlay) in the exact Figma style.
export const drawCatchment = async (
    state: ToolState,
    entryLabel: string,
    ranges: ReachableRange[],
    showOriginPin = true,
    drawGeometry = true,
    rangeColors?: string[],
): Promise<void> => {
    // A fresh catchment supersedes the previous site marker and ranked pins (their owners re-add them).
    clearSiteMarker();
    clearRankedPins();
    for (const entry of [...state.ranges.entries]) await state.ranges.removeEntry(entry.id);
    const rangesId = await state.ranges.addEntry({ label: entryLabel, data: ranges });
    // rangeColors (one per range) stamps `properties.color` so fill/border paint per feature.
    const features = ranges.flatMap((range, index) =>
        (range.polygon?.features ?? []).map((feature: PolygonFeatures['features'][number]) =>
            rangeColors
                ? { ...feature, properties: { ...feature.properties, color: rangeColors[index] } }
                : feature,
        ),
    );
    const merged = { type: 'FeatureCollection', features } as PolygonFeatures;
    if (drawGeometry) {
        const geometriesModule = await state.ranges.getEntryGeometriesModule(rangesId, 'outline');
        // Configured before showing — no default-theme flash.
        styleCatchment(geometriesModule, !!rangeColors);
        await geometriesModule.show(merged);
    }
    if (showOriginPin) {
        const pins: Place[] = ranges.map((range, index) => ({
            type: 'Feature',
            id: `site-${rangesId}-${index}`,
            geometry: { type: 'Point', coordinates: range.origin.position },
            properties: { type: 'Point Address', address: { freeformAddress: range.origin.query ?? '' } },
        }));
        const placesModule = await state.ranges.getEntryPlacesModule(rangesId);
        await placesModule.show(pins);
    }
    await state.ranges.markEntryShown(rangesId);
    if (features.length > 0) {
        state.baseMap.mapLibreMap.fitBounds(turf.bbox(merged) as [number, number, number, number], { padding: 60 });
    }
};

const STEPS = [
    'Locating site',
    'Building catchment',
    'Counting households',
    'Finding competitors',
    'Nearest parking',
    'Area make-up',
];

export const profileSite: ToolEntry = {
    description:
        'Profile a SINGLE candidate site for a retail/service concept. Draws the catchment, all competitor pins, ' +
        'a line to the nearest competitor (with distance), all nearby parking points (line to the nearest), and reports households (address ' +
        'count), competition, parking and area make-up — all shown in the Site Profile panel. Defaults to an ~800 m ' +
        'walking radius; large-format / car-oriented concepts use a driving catchment. For "what kind of area is X" ' +
        'questions, answer only from the returned areaMakeup counts (residential character is not measurable).',
    classificationPrompt:
        'Profile / assess / size up ONE candidate location for opening a store or site, OR characterize what kind ' +
        'of area an address is in (offices / tourist / retail / residential character).',
    inputSchema: profileSiteSchema,
    execute: (async (params: ProfileSiteInput, state: ToolState) => {
        const progress = startProgress('profileSite', STEPS);
        try {
            const { address, concept, competitorCategories, includeParking } = params;
            const { walking, walkReachMeters, driveMinutes } = resolveCatchment(state, params);
            progress.step(0);
            const place = await geocodeOne(address);
            const position: [number, number] = [place.geometry.coordinates[0], place.geometry.coordinates[1]];
            const label = place.properties.address?.freeformAddress ?? address;

            progress.step(1);
            const catchment = await (walking
                ? buildWalkCircle(position, walkReachMeters)
                : buildDriveIsochrone(position, driveMinutes));
            const catchmentKm2 = Math.round((turf.area(catchment) / 1e6) * 100) / 100;
            const basis = walking ? `≈${walkReachMeters} m walk radius` : `${driveMinutes}-min drive`;
            const budgets: ReachableRange['budgets'] = [
                walking
                    ? { type: 'distanceKM', value: walkReachMeters / 1000 }
                    : { type: 'timeMinutes', value: driveMinutes },
            ];
            await drawCatchment(
                state,
                `${concept} catchment — ${basis} — ${label}`,
                [
                    {
                        origin: { query: label, position },
                        budgets,
                        polygon: { type: 'FeatureCollection', features: [catchment] } as PolygonFeatures,
                    },
                ],
                false, // profileSite draws its own Figma pin + label (drawSiteMarker) — no SDK origin pin
                false, // and renders the catchment itself (drawRichOverlay) in the Figma style — no SDK outline
            );

            progress.step(2);
            const households = await countHouseholds(catchment.geometry);

            progress.step(3);
            const competitors = await findCompetitors(catchment, position, concept, competitorCategories);

            progress.step(4);
            const parking = includeParking ? await findParking(catchment, position) : null;

            progress.step(5);
            const areaMakeup = await findAreaMakeup(catchment);
            const traffic = await trafficNote(position);

            // Rich overlay: every competitor as a clickable pin (name + category in a popup), a line to
            // the nearest one (+distance), every parking facility as a point and a line to the nearest one.
            // The site itself is pinned separately by drawSiteMarker.
            const points: OverlayPoint[] = [];
            for (const feature of competitors.features) {
                const pos = positionOf(feature);
                if (!pos) continue;
                const place = placeInfo(feature);
                points.push({ position: pos, kind: 'competitor', name: place.name, info: place.category });
            }
            const lines: OverlayLine[] = [];
            if (competitors.nearestPosition && competitors.nearestMeters !== null) {
                lines.push({
                    from: position,
                    to: competitors.nearestPosition,
                    label: `${competitors.nearestMeters} m`,
                    kind: 'competitor',
                });
            }
            if (parking) {
                for (const feature of parking.features) {
                    const pos = positionOf(feature);
                    if (!pos) continue;
                    const place = placeInfo(feature);
                    points.push({
                        position: pos,
                        kind: 'parking',
                        name: place.name || 'Parking',
                        info: place.category,
                    });
                }
                if (parking.nearestPosition && parking.nearestMeters !== null) {
                    lines.push({
                        from: position,
                        to: parking.nearestPosition,
                        label: `${parking.nearestMeters} m`,
                        kind: 'parking',
                    });
                }
            }
            await drawRichOverlay(state, `Profile — ${label}`, points, lines, catchment.geometry);
            // Hide any stray PlacesModule pin left by a prior locatePlace/discoverPlaces (e.g. an
            // earlier "Messe Berlin" locate) so the focused profile shows ONLY our Figma site pin —
            // otherwise the SDK pin and the custom pin stack on the same spot. profileSite draws its
            // own competitor/parking markers via the BYOD overlay, so it never needs state.places.
            // `clearShownEntries` only hides — the entries stay in history, so a later
            // analyseData({ placesEntryIDs: [...] }) can still resolve them (reset() would wipe them).
            await state.places.clearShownEntries();
            // The Figma on-map address label under the site pin (single-site cue).
            drawSiteMarker(state, position, label);

            const notes = [
                traffic,
                'Households = address (PointAddress) count in the catchment — a dwellings proxy, not residents.',
            ];
            publishProfile({
                site: pointFeature(position, label, {
                    label,
                    mode: walking ? 'walking' : 'driving',
                    basis,
                    catchmentKm2,
                    households,
                    competitors: {
                        count: competitors.count,
                        capped: competitors.capped,
                        nearestMeters: competitors.nearestMeters,
                        nearestLabel: competitors.nearestLabel,
                        matchedBy: competitors.matchedBy,
                    },
                    parking: parking ? { count: parking.count, nearestMeters: parking.nearestMeters } : null,
                    areaMakeup,
                    notes,
                    rerun: { address, concept, includeParking, walkReachMeters, driveMinutes, competitorCategories },
                }),
                catchment: toPolygonFeature(catchment, label),
            });
            progress.done();
            return {
                ok: true as const,
                panel: 'Site Profile',
                headline: `Profiled ${label} for ${concept}.`,
                hint: 'All metrics are in the Site Profile panel. Summarise in ONE short sentence; do NOT restate the panel numbers.',
            };
        } catch (error) {
            progress.done();
            return {
                error: `Could not profile "${params.address}": ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }) as ToolEntry['execute'],
    examplePrompts: [
        'Profile Marnixstraat 250 Amsterdam for a coffee shop',
        'Size up Damrak 70 for a drive-through',
        'What kind of area is Keizersgracht 200 — offices, tourists, residential?',
        'Assess Nieuwendijk 100 for a bakery — enough footfall, not too many rivals?',
        'Profile Overtoom 50 for a gym with a 15-minute walking catchment',
        'How many competing pharmacies are within walking distance of Ferdinand Bolstraat 30?',
    ],
};
