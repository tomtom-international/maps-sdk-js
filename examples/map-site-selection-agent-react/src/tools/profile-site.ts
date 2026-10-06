import {
    type BBox,
    type BudgetType,
    getPosition,
    type Place,
    type PolygonFeature,
    type PolygonFeatures,
} from '@tomtom-org/maps-sdk/core';
import { calculateReachableRange, geocodeOne, trafficAreaAnalytics } from '@tomtom-org/maps-sdk/services';
import type { ReachableRange, ToolEntry, ToolEntryBuilder, ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { getViewportBias, locatePlace } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import * as turf from '@turf/turf';
import type { Feature, GeoJsonProperties, MultiPolygon, Polygon } from 'geojson';
import { z } from 'zod';
import { km2 } from '../agent/geometry';
import { resolveCatchment } from '../agent/site-selection-state';
import { EVENING_HOURS, MORNING_HOURS, utcOffsetHours, weekdayPeakCongestion } from '../agent/traffic-peaks';
import { MOVE_PORTAL_KEY } from '../config';
import {
    countHouseholds,
    householdsEnabled,
    nearestMeters,
    placeInfo,
    type SearchFeature,
    searchInGeometry,
    searchLimit,
} from '../demographics/households';
import { startProgress } from '../progress/progress-store';
import { type Counted, type ProfileSiteProps, pointFeature, publishProfile } from '../results/results-store';
import {
    clearRankedPins,
    clearSiteMarker,
    drawRichOverlay,
    drawSiteMarker,
    fitBesidePanel,
    type OverlayLine,
    type OverlayPoint,
    styleCatchment,
    withColor,
} from '../viz/site-visuals';
import { resolveCategories, resolveCategoriesWithNames, wordsOf } from './categories';

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

// Traffic: analyse a ~1.5 km area around the site, read weekday peaks. The window starts 31 days ago,
// the SDK's maximum span, and the SDK ends it at the latest published day, three days ago, so it reads
// about the last 29 days.
const TRAFFIC_BUFFER_KM = 1.5;
const TRAFFIC_START_DAYS_AGO = 31;

const PARKING_TERMS = ['parking'];

// Broad buckets for the "what kind of place is this?" read. The catalog has no office category:
// "office" resolves to Office Equipment, a shop, so offices are counted as companies and business parks.
const AREA_BUCKETS = [
    { key: 'foodDrink', label: 'Food & drink', terms: ['restaurant', 'cafe', 'bar'] },
    { key: 'retail', label: 'Retail', terms: ['shop'] },
    { key: 'office', label: 'Offices', terms: ['company', 'business park'] },
    { key: 'hotel', label: 'Hotels', terms: ['hotel'] },
    { key: 'transport', label: 'Transport', terms: ['public transport', 'parking'] },
] as const;

const profileSiteSchema = z.object({
    addresses: z.array(z.string()).min(1).describe('One or more candidate site addresses or place names to profile.'),
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

// Below this the address geocoder may have matched a landmark name ("The Venetian") to an unrelated
// street, town or building elsewhere, since landmarks are POIs it does not index.
const MIN_ADDRESS_MATCH_CONFIDENCE = 0.8;

// The lower-cased words of a name, accents dropped, short words ("the", house numbers) left out.
const nameWords = (text: string): string[] => wordsOf(text).filter((word) => word.length >= 4);

// A POI stands in for a weak address match only when its name shares a word with the query, so a
// misspelt street keeps its address instead of turning into whatever POI the search ranked first.
const namesQuery = (poi: Place, query: string): boolean => {
    const poiWords = new Set(nameWords(poi.properties.poi?.name ?? ''));
    return nameWords(query).some((word) => poiWords.has(word));
};

/**
 * Resolve a site's address or landmark name, biased toward the map view: a confident address match,
 * else a POI named like the query (a landmark), else the weak address match, else any POI found; null
 * when neither lookup finds the site.
 */
export const geocodeSite = async (query: string, state: ToolState): Promise<Place | null> => {
    const center = getViewportBias(state.baseMap);
    const geoBias = center && { position: center };
    const address = await geocodeOne({ query, geoBias }).catch(() => null);
    if (address && address.properties.matchConfidence.score >= MIN_ADDRESS_MATCH_CONFIDENCE) return address;

    const poi = await locatePlace(query, 'poi', geoBias).catch(() => null);
    if (poi && namesQuery(poi, query)) return poi;
    return address ?? poi;
};

const positionOf = (feature: SearchFeature): [number, number] | null => {
    const p = getPosition(feature);
    return p ? [p[0], p[1]] : null;
};

// Count POIs matching category terms inside the catchment (search, up to searchLimit()).
// null (never 0) when nothing resolves or the search fails. `capped` = count hit the window.
export const countCategory = async (catchment: Catchment, terms: string[]): Promise<Counted> => {
    try {
        const codes = await resolveCategories(terms);
        if (codes.length === 0) return { count: null, capped: false };
        const { features, capped } = await searchInGeometry(catchment.geometry, {
            poiCategories: codes,
            limit: searchLimit(),
        });
        return { count: features.length, capped };
    } catch {
        return { count: null, capped: false };
    }
};

// POIs found around a site: every feature (for map pins) and the nearest one (for the connector line).
type NearbyPlaces = Counted & {
    features: SearchFeature[];
    nearestMeters: number | null;
    nearestPosition: [number, number] | null;
};

// No places found, or the search failed: an unknown count, never zero.
const NO_NEARBY_PLACES: NearbyPlaces = {
    features: [],
    count: null,
    capped: false,
    nearestMeters: null,
    nearestPosition: null,
};

// Competitors inside the catchment, category-first (language-independent), with the nearest one's
// address and a readable matchedBy.
export const findCompetitors = async (
    catchment: Catchment,
    sitePosition: [number, number],
    concept: string,
    competitorCategories: string[] | undefined,
): Promise<NearbyPlaces & { nearestLabel: string | null; matchedBy: string }> => {
    try {
        const { codes, names } = await resolveCategoriesWithNames(
            competitorCategories?.length ? competitorCategories : [concept],
        );
        const { features, capped } = await searchInGeometry(catchment.geometry, {
            poiCategories: codes,
            query: concept,
            limit: searchLimit(),
            timeZone: 'iana',
        });
        const nearest = nearestMeters(sitePosition, features);
        return {
            features,
            count: features.length,
            capped,
            nearestMeters: nearest.meters,
            nearestPosition: nearest.feature ? positionOf(nearest.feature) : null,
            nearestLabel: nearest.feature?.properties?.address?.freeformAddress ?? null,
            matchedBy: codes.length ? `categories: ${names.join(', ')}` : 'name match (no category resolved)',
        };
    } catch {
        return { ...NO_NEARBY_PLACES, nearestLabel: null, matchedBy: 'search failed' };
    }
};

// Parking facilities in the catchment.
export const findParking = async (catchment: Catchment, sitePosition: [number, number]): Promise<NearbyPlaces> => {
    try {
        const codes = await resolveCategories(PARKING_TERMS);
        if (codes.length === 0) return NO_NEARBY_PLACES;
        const { features, capped } = await searchInGeometry(catchment.geometry, {
            poiCategories: codes,
            limit: searchLimit(),
            timeZone: 'iana',
        });
        const nearest = nearestMeters(sitePosition, features);
        return {
            features,
            count: features.length,
            capped,
            nearestMeters: nearest.meters,
            nearestPosition: nearest.feature ? positionOf(nearest.feature) : null,
        };
    } catch {
        return NO_NEARBY_PLACES;
    }
};

const findAreaMakeup = async (catchment: Catchment): Promise<ProfileSiteProps['areaMakeup']> =>
    Promise.all(
        AREA_BUCKETS.map(async (bucket) => ({
            key: bucket.key,
            label: bucket.label,
            ...(await countCategory(catchment, [...bucket.terms])),
        })),
    );

// The site's IANA time zone, from the first competitor or parking POI that carries one (their
// searches ask for `timeZone: 'iana'`).
const siteTimeZone = (features: readonly SearchFeature[]): string | undefined =>
    features.map((feature) => feature.properties.poi?.timeZone?.ianaId).find((ianaId) => ianaId !== undefined);

// Now, moved back `days` UTC calendar days: Area Analytics reads a Date by its UTC day.
const daysAgo = (days: number): Date => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days);
    return date;
};

// Traffic profile → a single honest note string (congestion/speeds only; never vehicle counts/mix,
// which TomTom lacks). Area Analytics takes the Move Portal key, not the Maps one; degrades to an
// "unavailable" note. The peaks need the site's time zone to read the UTC hours on its own clock.
const trafficNote = async (position: [number, number], timeZone: string | undefined): Promise<string> => {
    try {
        const area = turf.buffer(turf.point(position), TRAFFIC_BUFFER_KM, { units: 'kilometers' });
        if (!area) return 'Traffic profile unavailable.';
        const result = await trafficAreaAnalytics({
            apiKey: MOVE_PORTAL_KEY,
            geometry: area.geometry,
            metrics: 'all',
            functionalRoadClasses: 'all',
            hours: 'all',
            startDate: daysAgo(TRAFFIC_START_DAYS_AGO),
        });
        const base = result.features[0]?.properties?.baseData;
        if (!base || (base.congestionLevel === undefined && base.speed === undefined)) {
            return 'Traffic profile unavailable (no traffic data for this area).';
        }
        const average = result.features[0]?.properties?.timedData?.average ?? [];
        const offsetHours = timeZone === undefined ? undefined : utcOffsetHours(timeZone, new Date());
        const peak = (hours: readonly number[]) =>
            offsetHours === undefined ? null : weekdayPeakCongestion(average, hours, offsetHours);
        const am = peak(MORNING_HOURS);
        const pm = peak(EVENING_HOURS);
        return `Traffic (≈${TRAFFIC_BUFFER_KM} km, weekday): congestion ${base.congestionLevel ?? '—'}%, AM peak ${am ?? '—'}%, PM peak ${pm ?? '—'}% (congestion and speeds only, no vehicle counts or mix).`;
    } catch {
        return 'Traffic profile unavailable.';
    }
};

// Draw the catchment polygon + origin pin via the built-in `ranges` slice; replaces prior catchments.
// `showOriginPin` defaults to true (multi-site compare/rank want a labelled pin per origin); profileSite
// passes false and instead draws the Figma pin + address label itself (drawSiteMarker), so the single
// site doesn't get two stacked pins/labels. `drawGeometry` defaults to true (the SDK 'outline' fill style);
// profileSite passes false and renders the catchment itself (drawRichOverlay) in the exact Figma style.
// Returns the id of the ranges entry the catchments live in.
export const drawCatchment = async (
    state: ToolState,
    entryLabel: string,
    ranges: ReachableRange[],
    showOriginPin = true,
    drawGeometry = true,
    rangeColors?: string[],
): Promise<string> => {
    // A fresh catchment supersedes the previous site marker and ranked pins (their owners re-add them).
    clearSiteMarker();
    clearRankedPins();
    for (const entry of [...state.ranges.entries]) await state.ranges.removeEntry(entry.id);
    const rangesId = await state.ranges.addEntry({ label: entryLabel, data: ranges });
    // rangeColors (one per range) stamps `properties.color` so fill/border paint per feature.
    const features = ranges.flatMap((range, index) =>
        (range.polygon?.features ?? []).map((feature: PolygonFeatures['features'][number]) =>
            rangeColors ? withColor(feature, rangeColors[index]) : feature,
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
        fitBesidePanel(state, turf.bbox(merged) as BBox, 60);
    }
    return rangesId;
};

const buildSteps = (n: number): string[] => [
    n === 1 ? 'Locating site' : 'Locating sites',
    n === 1 ? 'Building catchment' : 'Building catchments',
    ...(householdsEnabled() ? ['Counting households'] : []),
    'Finding competitors',
    'Parking & area make-up',
];
// Later phase indices shift when the households step is hidden.
const stepCompetitors = (): number => (householdsEnabled() ? 3 : 2);
const stepFinish = (): number => (householdsEnabled() ? 4 : 3);

// BUILDER: the description mentions households only when the household signal is available, so it
// is assembled at createMapAgent time rather than at module load. The signal is read from
// `householdsEnabled()`, which now always reports false — see demographics/experimental-search.ts.
export const profileSite: ToolEntryBuilder = () => {
    const households = householdsEnabled();
    return {
        description:
            'Profile one or more candidate sites for a retail/service concept. Pass ALL addresses in a SINGLE call — ' +
            'never call this tool more than once per user request. For each site: draws the catchment, all competitor pins, a line to the ' +
            'nearest competitor (with distance), all nearby parking points (line to the nearest), and reports ' +
            (households ? 'households (address count), ' : '') +
            'competition, parking and area make-up — all shown in the Site Profile panel. Defaults to an ' +
            '~800 m walking radius; large-format / car-oriented concepts use a driving catchment. For "what kind of area ' +
            'is X" questions, answer only from the returned areaMakeup counts (residential character is not measurable).',
        classificationPrompt:
            'Profile / assess / size up one or more candidate locations for opening a store or site, OR characterize ' +
            'what kind of area an address is in (offices / tourist / retail / residential character).',
        inputSchema: profileSiteSchema,
        execute: executeProfileSite,
        examplePrompts: PROFILE_SITE_EXAMPLE_PROMPTS,
    };
};

/** Shared executor — also invoked directly by the Site Profile panel's radius switcher (re-run). */
export const executeProfileSite = (async (params: ProfileSiteInput, state: ToolState) => {
    const { addresses, concept, competitorCategories, includeParking } = params;
    const progress = startProgress('profileSite', buildSteps(addresses.length));
    const { walking, walkReachMeters, driveMinutes } = resolveCatchment(state, params);
    const basis = walking ? `≈${walkReachMeters} m walk radius` : `${driveMinutes}-min drive`;
    const budgets: ReachableRange['budgets'] = [
        walking ? { type: 'distanceKM', value: walkReachMeters / 1000 } : { type: 'timeMinutes', value: driveMinutes },
    ];

    try {
        // Phase 0 — geocode all sites
        progress.step(0);
        const geos: { address: string; position: [number, number]; label: string }[] = [];
        for (const address of addresses) {
            const place = await geocodeSite(address, state);
            if (!place) throw new Error(`No location found for "${address}".`);

            geos.push({
                address,
                position: [place.geometry.coordinates[0], place.geometry.coordinates[1]],
                label: place.properties.address?.freeformAddress ?? address,
            });
        }

        // Phase 1 — build catchments for all sites
        progress.step(1);
        const catchmentData: {
            address: string;
            position: [number, number];
            label: string;
            catchment: Catchment;
            catchmentKm2: number;
        }[] = [];
        for (const { address, position, label } of geos) {
            const catchment = await (walking
                ? buildWalkCircle(position, walkReachMeters)
                : buildDriveIsochrone(position, driveMinutes));
            await drawCatchment(
                state,
                `${concept} catchment (${basis}): ${label}`,
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
            catchmentData.push({
                address,
                position,
                label,
                catchment,
                catchmentKm2: km2(catchment),
            });
        }

        // Phase 2 — households for all sites (the whole phase disappears when the household
        // signal is off; the panel/report then hide the metric entirely).
        const householdsAll: Counted[] = [];
        if (householdsEnabled()) {
            progress.step(2);
            for (const { catchment } of catchmentData) {
                householdsAll.push(await countHouseholds(catchment.geometry));
            }
        }

        // Phase 3 — competitors for all sites
        progress.step(stepCompetitors());
        const competitorsAll: Awaited<ReturnType<typeof findCompetitors>>[] = [];
        for (const { catchment, position } of catchmentData) {
            competitorsAll.push(await findCompetitors(catchment, position, concept, competitorCategories));
        }

        // Phase 4 — parking, area make-up, overlay, publish for all sites
        progress.step(stepFinish());
        const labels: string[] = [];
        for (let i = 0; i < catchmentData.length; i++) {
            const { address, position, label, catchment, catchmentKm2 } = catchmentData[i]!;
            const households = householdsEnabled() ? householdsAll[i]! : null;
            const competitors = competitorsAll[i]!;
            labels.push(label);

            const parking = includeParking ? await findParking(catchment, position) : null;
            const areaMakeup = await findAreaMakeup(catchment);
            const traffic = await trafficNote(
                position,
                siteTimeZone([...competitors.features, ...(parking?.features ?? [])]),
            );

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
            await drawRichOverlay(state, `Profile: ${label}`, points, lines, catchment.geometry);
            // Hide any stray PlacesModule pin left by a prior locatePlace/discoverPlaces (e.g. an
            // earlier "Las Vegas Convention Center" locate) so the focused profile shows ONLY our Figma site pin —
            // otherwise the SDK pin and the custom pin stack on the same spot. profileSite draws its
            // own competitor/parking markers via the BYOD overlay, so it never needs state.places.
            // `clearShownEntries` only hides — the entries stay in history, so a later
            // analyseData({ placesEntryIDs: [...] }) can still resolve them (reset() would wipe them).
            await state.places.clearShownEntries();
            // The Figma on-map address label under the site pin (single-site cue).
            drawSiteMarker(state, position, label);

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
                    parking: parking
                        ? { count: parking.count, capped: parking.capped, nearestMeters: parking.nearestMeters }
                        : null,
                    areaMakeup,
                    notes: [
                        traffic,
                        ...(householdsEnabled()
                            ? [
                                  'Households = address (PointAddress) count in the catchment, a dwellings proxy, not residents.',
                              ]
                            : []),
                    ],
                    rerun: {
                        address,
                        concept,
                        includeParking,
                        walkReachMeters,
                        driveMinutes,
                        competitorCategories,
                    },
                }),
                catchment: toPolygonFeature(catchment, label),
            });
        }

        progress.done();
        return {
            ok: true as const,
            panel: 'Site Profile',
            headline:
                labels.length === 1
                    ? `Profiled ${labels[0]} for ${concept}.`
                    : `Profiled ${labels.join(', ')} for ${concept}.`,
            hint: 'All metrics are in the Site Profile panel. Summarise in ONE short sentence; do NOT restate the panel numbers.',
        };
    } catch (error) {
        progress.done();
        return {
            error: `Could not profile "${addresses.join(', ')}": ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}) as ToolEntry['execute'];

const PROFILE_SITE_EXAMPLE_PROMPTS = [
    'Profile 3200 S Las Vegas Blvd, Las Vegas for a coffee shop',
    'Size up 6605 S Eastern Ave for a drive-through',
    'What kind of area is 400 S 4th St: offices, tourists, residential?',
    'Assess 425 Fremont St for a bakery: enough footfall, not too many rivals?',
    'Profile 9350 W Sahara Ave for a gym with a 15-minute walking catchment',
    'How many competing pharmacies are within walking distance of 2020 E Charleston Blvd?',
];
