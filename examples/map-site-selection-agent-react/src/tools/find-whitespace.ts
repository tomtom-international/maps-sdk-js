import { type CommonPlaceProps, getPosition, type PolygonFeature } from '@tomtom-org/maps-sdk/core';
import { reverseGeocode } from '@tomtom-org/maps-sdk/services';
import type { ToolEntry, ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { isResolveError, resolveAreas, toolStateToWhereContext } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from 'geojson';
import { z } from 'zod';
import { byodCandidateSites, requireByodFeatures } from '../agent/byod-inputs';
import { getSitePreferences } from '../agent/site-selection-state';
import {
    placeInfo,
    SEARCH_LIMIT,
    type SearchFeature,
    searchAddresses,
    searchInGeometry,
} from '../demographics/households';
import { pocketColor } from '../pocket-colors';
import { startProgress } from '../progress/progress-store';
import { pointCollection, pointFeature, publishWhitespace, type WhitespacePocketProps } from '../results/results-store';
import {
    CATEGORY_OTHER_COLOR,
    CATEGORY_PALETTE,
    clipHexToArea,
    drawHexOutlineGrid,
    drawNumberedHexes,
    drawRichOverlay,
    type OverlayPoint,
    styleScanArea,
} from '../viz/site-visuals';
import { resolveCategoriesWithNames } from './categories';
import { toPolygonFeature } from './profile-site';

// The default demand-anchor basket now lives on the session-preferences slice (site-selection-state),
// so a request inherits it and the user can change it once for the session.
const MIN_DEMAND = 2;
const MAX_GRID_CELLS = 20000;
const MIN_COVERAGE = 0.5; // a perimeter hex must be ≥50% inside the region to be ranked (drops slivers)
const AREA_FALLBACK_KM = 5; // circle radius used when the query has no admin boundary polygon

type Colocation = 'avoid' | 'seek';

type AreaGeometry = Polygon | MultiPolygon;
type ResolvedArea = { geometry: AreaGeometry; label: string; km2: number; source: 'boundary' | 'radius' };

const findWhitespaceSchema = z.object({
    area: z.string().describe('City / district / neighbourhood to scan, e.g. "Amsterdam Oost".'),
    targetCategories: z
        .array(z.string())
        .min(1)
        .describe(
            'The concept / its peer category whose proximity drives the score. Simple terms ("gym", "cafe") or codes.',
        ),
    colocation: z
        .enum(['avoid', 'seek'])
        .default('avoid')
        .describe(
            '"avoid" (default): reward DISTANCE from peers (gym, pharmacy). "seek": reward PROXIMITY (comparison retail — furniture, fashion).',
        ),
    demandAnchors: z
        .array(z.string())
        .optional()
        .describe(
            'Concept-specific POI types signalling demand. Use SPECIFIC terms that each map to one clean category (gym → "university", "public transport", "supermarket", "sports shop"). Avoid generic words like "office" or "shop" — they resolve to unrelated compounds (Post Office, Pawn Shop) and pollute the signal. Omit to use the session-default anchors.',
        ),
    demandByodEntryId: z
        .string()
        .optional()
        .describe(
            'Optional BYOD layer (from addByodSource) whose features are counted as EXTRA demand near each ' +
                "cell — e.g. the customer's own footfall or demand points. Polygons/lines are reduced to their " +
                'centroid. Augments the searched anchor demand.',
        ),
    householdDemand: z
        .boolean()
        .default(false)
        .describe(
            'Blend RESIDENTIAL density (address-point count per cell) into demand — set true for concepts whose customers are local residents (daycare, pharmacy, GP, grocery, gym), where families/homes nearby matter more than anchor POIs. Leave false for destination/comparison retail. Note: the address sample caps at 100 per scan, so it is a coarse relative signal, not a true count.',
        ),
    walkRadiusMeters: z
        .number()
        .positive()
        .optional()
        .describe('The walk defining the goal + demand radius (800 m ≈ 10-min walk). Omit to use the session default.'),
    cellSizeMeters: z.number().positive().default(400).describe('Hex-grid cell size; smaller = finer scan.'),
    topN: z
        .number()
        .int()
        .min(1)
        .max(20)
        .default(5)
        .describe('How many top opportunity pockets to return + draw (keep 3-5).'),
});

type FindWhitespaceInput = z.infer<typeof findWhitespaceSchema>;

const resolveArea = async (query: string, state: ToolState): Promise<ResolvedArea | null> => {
    const result = await resolveAreas({ queries: [{ query, queryAs: 'place' }] }, toolStateToWhereContext(state));
    if (isResolveError(result) || result.length === 0) return null;
    const raw = result[0];
    if (raw.polygon) {
        const geometry = raw.polygon as AreaGeometry;
        const areaKm2 = Math.round((turf.area({ type: 'Feature', geometry, properties: {} }) / 1e6) * 100) / 100;
        return {
            geometry,
            label: raw.label ?? query,
            km2: areaKm2,
            source: 'boundary',
        };
    }
    // No admin boundary — fall back to a circle around the bbox centre.
    const center: [number, number] = [(raw.bbox[0] + raw.bbox[2]) / 2, (raw.bbox[1] + raw.bbox[3]) / 2];
    const circle = turf.circle(center, AREA_FALLBACK_KM, { units: 'kilometers' });
    return {
        geometry: circle.geometry as AreaGeometry,
        label: raw.label ?? query,
        km2: Math.round(Math.PI * AREA_FALLBACK_KM * AREA_FALLBACK_KM * 100) / 100,
        source: 'radius',
    };
};

const countWithin = (centre: [number, number], features: readonly SearchFeature[], radius: number): number => {
    let count = 0;
    for (const feature of features) {
        const position = getPosition(feature);
        if (position && turf.distance(centre, [position[0], position[1]]) * 1000 <= radius) count += 1;
    }
    return count;
};

// Position-only twin of countWithin for BYOD demand points, so user-supplied demand never depends on
// the SDK feature shape (BYOD features carry plain GeoJSON coordinates, not SDK POI properties).
const countPointsWithin = (
    centre: [number, number],
    positions: readonly [number, number][],
    radius: number,
): number => {
    let count = 0;
    for (const position of positions) {
        if (turf.distance(centre, position) * 1000 <= radius) count += 1;
    }
    return count;
};

// A distinct colour for the user's own demand layer in the map legend (kept off CATEGORY_PALETTE so it
// never collides with a searched-anchor category colour).
const BYOD_DEMAND_COLOR = '#111827';

const nearestPeerMeters = (centre: [number, number], features: readonly SearchFeature[]): number | null => {
    let nearest = Number.POSITIVE_INFINITY;
    for (const feature of features) {
        const position = getPosition(feature);
        if (!position) continue;
        const meters = turf.distance(centre, [position[0], position[1]]) * 1000;
        if (meters < nearest) nearest = meters;
    }
    return Number.isFinite(nearest) ? Math.round(nearest) : null;
};

// Closest demand POIs to a pocket centre (name + category + metres), nearest first — the per-pocket
// "what's actually nearby" detail for the report.
const nearestDemandPois = (
    centre: [number, number],
    features: readonly SearchFeature[],
    limit: number,
): { name: string; category: string; meters: number }[] => {
    const scored: { name: string; category: string; meters: number }[] = [];
    for (const feature of features) {
        const position = getPosition(feature);
        if (!position) continue;
        const place = placeInfo(feature);
        scored.push({
            name: place.name,
            category: place.category,
            meters: Math.round(turf.distance(centre, [position[0], position[1]]) * 1000),
        });
    }
    return scored.toSorted((a, b) => a.meters - b.meters).slice(0, limit);
};

// Colour every demand POI by its category, building a legend from the categories actually present.
// The most common categories get distinct palette colours; the long tail collapses into "Other".
// Also returns the full composition (every category + count) for the report.
type DemandLegend = { label: string; color: string }[];
type DemandComposition = { category: string; count: number }[];
const colourDemandPois = (
    features: readonly SearchFeature[],
): { points: OverlayPoint[]; legend: DemandLegend; composition: DemandComposition } => {
    const counts = new Map<string, number>();
    for (const feature of features) {
        const category = placeInfo(feature).category || 'Other';
        counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    const composition: DemandComposition = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({ category, count }));
    const colourOf = new Map<string, string>();
    const legend: DemandLegend = [];
    composition.forEach(({ category }, index) => {
        if (index < CATEGORY_PALETTE.length) {
            colourOf.set(category, CATEGORY_PALETTE[index]);
            legend.push({ label: category, color: CATEGORY_PALETTE[index] });
        } else {
            colourOf.set(category, CATEGORY_OTHER_COLOR);
        }
    });
    if (composition.length > CATEGORY_PALETTE.length) legend.push({ label: 'Other', color: CATEGORY_OTHER_COLOR });

    const points: OverlayPoint[] = [];
    for (const feature of features) {
        const position = getPosition(feature);
        if (!position) continue;
        const place = placeInfo(feature);
        const category = place.category || 'Other';
        points.push({
            position: [position[0], position[1]],
            kind: 'anchor',
            color: colourOf.get(category) ?? CATEGORY_OTHER_COLOR,
            name: place.name,
            info: place.category,
        });
    }
    return { points, legend, composition };
};

type Candidate = {
    hex: Feature<Polygon | MultiPolygon>;
    centre: [number, number];
    demand: number;
    households: number; // address points within radius (0 when householdDemand is off)
    nearestTargetMeters: number | null;
    beyondWalk: boolean;
};
type ScoredPocket = Candidate & { opportunity: number };

const normalize = (value: number, min: number, max: number): number => (max > min ? (value - min) / (max - min) : 0.5);

// Default split for the opportunity score: demand 60% / peer proximity 40%. The two normalized
// components are stored per pocket (demandNorm / peerNorm) so the panel can re-blend them live.
const DEFAULT_DEMAND_WEIGHT = 0.6;
const blendNorms = (
    candidate: Candidate,
    demandRange: [number, number],
    householdRange: [number, number],
    gapRange: [number, number],
    hasTargets: boolean,
    colocation: Colocation,
    useHouseholds: boolean,
): { demandNorm: number; peerNorm: number } => {
    const anchorNorm = normalize(candidate.demand, demandRange[0], demandRange[1]);
    // For resident-serving concepts, blend residential (address) density 50/50 with the anchor signal.
    const demandNorm = useHouseholds
        ? (anchorNorm + normalize(candidate.households, householdRange[0], householdRange[1])) / 2
        : anchorNorm;
    let peerNorm: number;
    if (!hasTargets || candidate.nearestTargetMeters === null) peerNorm = colocation === 'seek' ? 0 : 1;
    else {
        const farness = normalize(candidate.nearestTargetMeters, gapRange[0], gapRange[1]);
        peerNorm = colocation === 'seek' ? 1 - farness : farness;
    }
    return { demandNorm, peerNorm };
};

const scoreOpportunity = (
    candidate: Candidate,
    demandRange: [number, number],
    householdRange: [number, number],
    gapRange: [number, number],
    hasTargets: boolean,
    colocation: Colocation,
    useHouseholds: boolean,
): number => {
    const { demandNorm, peerNorm } = blendNorms(
        candidate,
        demandRange,
        householdRange,
        gapRange,
        hasTargets,
        colocation,
        useHouseholds,
    );
    // Demand-favoured (0.6) over peer proximity (0.4): commercial viability is the precondition — a
    // pocket that is merely far from rivals but has little demand (e.g. an industrial edge) should not
    // outrank a genuinely busy one. Peer proximity still earns the remaining 40%.
    return Math.round(100 * (DEFAULT_DEMAND_WEIGHT * demandNorm + (1 - DEFAULT_DEMAND_WEIGHT) * peerNorm));
};

// Greedy spatial suppression so the top-N are distinct places (≥ one walk apart), not a blob.
const selectDistinct = async (
    ranked: ScoredPocket[],
    minSeparationMeters: number,
    topN: number,
): Promise<ScoredPocket[]> => {
    const top: ScoredPocket[] = [];
    for (const pocket of ranked) {
        if (top.length >= topN) break;
        if (top.some((other) => turf.distance(pocket.centre, other.centre) * 1000 < minSeparationMeters)) continue;
        try {
            const result = await reverseGeocode({ position: pocket.centre });
            if (result?.properties?.type === 'Geography') continue;
        } catch {}
        top.push(pocket);
    }
    return top;
};

// The execute() below is an orchestration of these phase helpers. They are split out (rather than
// inlined) to keep execute's cognitive complexity low; each is a verbatim lift of one phase.

type HexGrid = ReturnType<typeof turf.hexGrid>;

// Build the hex grid for the area's bbox, auto-shrinking the cell size if the requested size yields no
// cells. Returns the (possibly adjusted) cell size so callers can warn when it changed.
const buildGrid = (
    bbox: [number, number, number, number],
    areaKm2: number,
    requestedCellSize: number,
): { grid: HexGrid; cellSizeMeters: number } => {
    let cellSizeMeters = requestedCellSize;
    let grid = turf.hexGrid(bbox, cellSizeMeters / 1000, { units: 'kilometers' });
    if (grid.features.length === 0) {
        cellSizeMeters = Math.max(50, Math.round((Math.sqrt(areaKm2) / 4) * 1000));
        grid = turf.hexGrid(bbox, cellSizeMeters / 1000, { units: 'kilometers' });
    }
    return { grid, cellSizeMeters };
};

// The signals each cell is scored against: searched anchors, BYOD demand points, residential
// addresses, and existing peers.
type ScanContext = {
    radius: number;
    householdDemand: boolean;
    anchorFeatures: SearchFeature[];
    byodDemandPositions: readonly [number, number][];
    addresses: { features: readonly SearchFeature[] };
    targetFeatures: SearchFeature[];
};

// Clip every hex to the region and keep the "busy" cells (anchor demand or, in household mode,
// residential density), recording each cell's demand, household count and nearest-peer distance.
// `allHexes` is EVERY cell that tiles the region (≥MIN_COVERAGE inside) regardless of demand — the map
// draws these as plain outlines so the scan's full coverage is visible; `candidates` is the busy subset
// that gets scored and (for the top pockets) filled. The two share hex references, so a pocket can be
// matched back to its outline cell by identity.
const buildCandidates = (
    grid: HexGrid,
    area: AreaGeometry,
    ctx: ScanContext,
): { candidates: Candidate[]; allHexes: Feature<Polygon | MultiPolygon>[] } => {
    const candidates: Candidate[] = [];
    const allHexes: Feature<Polygon | MultiPolygon>[] = [];
    for (const hex of grid.features) {
        const clipped = clipHexToArea(hex, area);
        if (!clipped) continue;
        // A border hex is kept (drawn / ranked) only if ≥50% of it lies inside the region — a sliver
        // poking in is dropped rather than shown or scored as a full cell.
        if (turf.area(clipped) / Math.max(turf.area(hex), 1) < MIN_COVERAGE) continue;
        allHexes.push(clipped);
        const centre = turf.centroid(clipped).geometry.coordinates as [number, number];
        const demand =
            countWithin(centre, ctx.anchorFeatures, ctx.radius) +
            countPointsWithin(centre, ctx.byodDemandPositions, ctx.radius);
        const households = ctx.householdDemand ? countWithin(centre, ctx.addresses.features, ctx.radius) : 0;
        // Keep a cell if it has anchor demand OR (in household mode) residential density.
        if (demand < MIN_DEMAND && households < MIN_DEMAND) continue;
        const nearest = nearestPeerMeters(centre, ctx.targetFeatures);
        candidates.push({
            hex: clipped,
            centre,
            demand,
            households,
            nearestTargetMeters: nearest,
            beyondWalk: nearest === null || nearest > ctx.radius,
        });
    }
    return { candidates, allHexes };
};

// The min-max ranges the scorer normalizes against, plus whether the residential signal is usable.
type Ranges = {
    demandRange: [number, number];
    householdRange: [number, number];
    gapRange: [number, number];
    useHouseholdSignal: boolean;
};

// Score every candidate and pick the distinct top-N.
const rankPockets = async (
    candidates: Candidate[],
    params: FindWhitespaceInput,
    radius: number,
    hasTargets: boolean,
    colocation: Colocation,
): Promise<{ top: ScoredPocket[]; ranges: Ranges }> => {
    const demands = candidates.map((c) => c.demand);
    const householdCounts = candidates.map((c) => c.households);
    const gaps = candidates.map((c) => c.nearestTargetMeters).filter((m): m is number => m !== null);
    const demandRange: [number, number] = [Math.min(...demands, 0), Math.max(...demands, 0)];
    const householdRange: [number, number] = [Math.min(...householdCounts, 0), Math.max(...householdCounts, 0)];
    const gapRange: [number, number] = [Math.min(...gaps, 0), Math.max(...gaps, 0)];
    // Only blend the residential signal when it actually VARIES across cells — guards against an
    // artificial normalize()=0.5 (and a false "+ residential address density" claim) when households
    // are constant or the address search returned nothing.
    const useHouseholdSignal = params.householdDemand && householdRange[1] > householdRange[0];
    const ranked = candidates
        .map((c) => ({
            ...c,
            opportunity: scoreOpportunity(
                c,
                demandRange,
                householdRange,
                gapRange,
                hasTargets,
                colocation,
                useHouseholdSignal,
            ),
        }))
        .sort((a, b) => b.opportunity - a.opportunity || b.demand - a.demand);

    const top = await selectDistinct(ranked, radius, params.topN);
    return { top, ranges: { demandRange, householdRange, gapRange, useHouseholdSignal } };
};

// Draw the scan-area outline, numbered opportunity hexes, demand POIs (incl. the BYOD demand layer),
// and existing peers; return the demand legend/composition for the panel.
const renderWhitespace = async (
    state: ToolState,
    params: FindWhitespaceInput,
    resolved: ResolvedArea,
    area: AreaGeometry,
    bbox: [number, number, number, number],
    top: ScoredPocket[],
    allHexes: Feature<Polygon | MultiPolygon>[],
    anchorFeatures: SearchFeature[],
    byodDemandPoints: readonly { label: string; position: [number, number] }[],
    targetFeatures: SearchFeature[],
): Promise<{ demandLegend: DemandLegend; demandComposition: DemandComposition }> => {
    // Scan-area outline (its own entry) + numbered, coloured opportunity hexes + peer markers.
    for (const entry of state.customGeometries.entries.filter((e) => e.provenance.operation === 'whitespace-area')) {
        await state.customGeometries.removeEntry(entry.id);
    }
    const areaFeature = {
        type: 'Feature',
        id: 'whitespace-area',
        geometry: area,
        properties: { name: `Scan area: ${resolved.label}` },
    } as unknown as PolygonFeature<CommonPlaceProps>;
    const areaEntryId = await state.customGeometries.addEntry(
        [areaFeature],
        { operation: 'whitespace-area', sourceIds: [] },
        `Scan area: ${resolved.label}`,
    );
    // Styled before showing — no default-theme flash.
    const areaGeometries = await state.customGeometries.getEntryGeometriesModule(areaEntryId, 'outline');
    styleScanArea(areaGeometries);
    await state.customGeometries.showEntry(areaEntryId, 'outline');

    // Every scanned cell as a plain, thin outline — shows the full grid coverage. Drawn before the
    // numbered pockets so the coloured, filled top-N sit on top of the bare grid.
    await drawHexOutlineGrid(state, `Scan grid: ${resolved.label}`, allHexes);

    await drawNumberedHexes(
        state,
        `Opportunity pockets: ${params.targetCategories.join(', ')} in ${resolved.label}`,
        top.map((pocket, index) => ({
            feature: pocket.hex,
            color: pocketColor(index).hex,
            number: index + 1,
            label: `#${index + 1} · opp ${pocket.opportunity}`,
        })),
    );

    // ALL demand POIs, each coloured by its category (legend in the panel) — shows what the demand is
    // actually made of across the whole scan area.
    const {
        points: anchorPoints,
        legend: demandLegend,
        composition: demandComposition,
    } = colourDemandPois(anchorFeatures);

    // The user's own demand points as one extra coloured layer (own legend entry), so a BYOD demand
    // layer is both counted (in buildCandidates) and visible on the map.
    const byodDemandOverlay: OverlayPoint[] = byodDemandPoints.map((point) => ({
        position: point.position,
        kind: 'anchor',
        color: BYOD_DEMAND_COLOR,
        name: point.label,
        info: 'your demand layer',
    }));
    if (byodDemandOverlay.length > 0) demandLegend.push({ label: 'Your demand layer', color: BYOD_DEMAND_COLOR });

    // Existing peers as RED, clickable 'competitor' dots (name + category in a popup) — distinct from
    // the multi-coloured opportunity hexes and the per-category demand dots.
    const peerMarkers: OverlayPoint[] = [];
    for (const feature of targetFeatures) {
        const p = getPosition(feature);
        if (!p) continue;
        const place = placeInfo(feature);
        peerMarkers.push({ position: [p[0], p[1]], kind: 'competitor', name: place.name, info: place.category });
    }
    // Demand POIs (per-category colours) first, peers (red) on top in one clickable overlay.
    await drawRichOverlay(
        state,
        `Existing ${params.targetCategories.join('/')} + demand POIs in ${resolved.label}`,
        [...anchorPoints, ...byodDemandOverlay, ...peerMarkers],
        [],
    );
    state.baseMap.mapLibreMap.fitBounds(bbox, { padding: 40 });
    return { demandLegend, demandComposition };
};

// The honest caveats for this scan (unresolved peer category, auto-shrunk cells, radius fallback,
// capped residential sample).
const buildWarnings = (
    params: FindWhitespaceInput,
    resolved: ResolvedArea,
    cellSizeMeters: number,
    targets: { codes: string[] },
    targetFeatures: SearchFeature[],
    addressesCapped: boolean,
): string[] => {
    const warnings: string[] = [];
    if (targets.codes.length === 0 && targetFeatures.length <= 1) {
        warnings.push(
            `Peer category "${params.targetCategories.join(', ')}" did not resolve to a TomTom category (found ${targetFeatures.length}) — pockets may be unreliable.`,
        );
    }
    if (cellSizeMeters !== params.cellSizeMeters) {
        warnings.push(`Cell size auto-reduced to ${cellSizeMeters} m to fit the ${resolved.km2} km² area.`);
    }
    if (resolved.source === 'radius') {
        warnings.push(
            `"${params.area}" had no administrative boundary — scanned a ${AREA_FALLBACK_KM} km radius around the best match.`,
        );
    }
    if (params.householdDemand && addressesCapped) {
        warnings.push(
            `Residential demand is approximate — ${resolved.label} has more than 100 addresses, so the household sample is capped and reads as a coarse relative density, not a true count.`,
        );
    }
    return warnings;
};

// Assemble the per-pocket result: each pocket is a Point feature (centre = geometry, attributes in
// properties, re-blending the stored norms for the live demand↔peer slider), with its clipped hex as an
// `id`-matched PolygonFeature alongside.
const buildPockets = (
    top: ScoredPocket[],
    ranges: Ranges,
    hasTargets: boolean,
    colocation: Colocation,
    anchorFeatures: SearchFeature[],
): { pockets: FeatureCollection<Point, WhitespacePocketProps>; hexes: PolygonFeature[] } => {
    const features: Feature<Point, WhitespacePocketProps>[] = [];
    const hexes: PolygonFeature[] = [];
    top.forEach((pocket, index) => {
        const norms = blendNorms(
            pocket,
            ranges.demandRange,
            ranges.householdRange,
            ranges.gapRange,
            hasTargets,
            colocation,
            ranges.useHouseholdSignal,
        );
        const id = `pocket-${index}`;
        const properties: WhitespacePocketProps = {
            color: pocketColor(index).name,
            opportunity: pocket.opportunity,
            demand: pocket.demand,
            demandNorm: norms.demandNorm,
            peerNorm: norms.peerNorm,
            households: ranges.useHouseholdSignal ? pocket.households : null,
            nearestTargetMeters: pocket.nearestTargetMeters,
            beyondWalk: pocket.beyondWalk,
            nearestDemand: nearestDemandPois(pocket.centre, anchorFeatures, 5),
        };
        features.push(pointFeature(pocket.centre, id, properties));
        hexes.push(toPolygonFeature(pocket.hex, id, { color: properties.color, opportunity: properties.opportunity }));
    });
    return { pockets: pointCollection(features), hexes };
};

export const findWhitespace: ToolEntry = {
    description:
        'Find the best sub-zones in an area for a concept: scans a hex grid (clipped to the region), ranks every ' +
        'busy cell on an opportunity score (0–100) blending demand-anchor density with peer proximity, and draws ' +
        'NUMBERED, coloured opportunity hexes plus the existing peers. colocation="avoid" rewards being away from ' +
        'peers; "seek" rewards clustering. demandAnchors drive the result most — use SPECIFIC category terms (gym → ' +
        'university, public transport, supermarket, sports shop), not generic words like "office"/"shop" that pull ' +
        'in unrelated compounds; if anchors are unstated, ask via clarifyIntent first. Set householdDemand=true for ' +
        'resident-serving concepts (daycare, pharmacy, grocery, gym). Opportunity score is 60% demand / 40% ' +
        'peer-proximity; demand is a proxy (anchor POIs ± address density), never measured footfall. Refer to a ' +
        'pocket by number AND colour, e.g. "Pocket 1 (teal)". Details in the panel.',
    classificationPrompt:
        'Find under-served gaps / whitespace / best opportunity zones for a concept within an area, given demand ' +
        'and a proximity preference to existing peers (avoid them, or cluster with them).',
    inputSchema: findWhitespaceSchema,
    execute: (async (params: FindWhitespaceInput, state: ToolState) => {
        const progress = startProgress('findWhitespace', [
            'Resolving area',
            'Searching anchors & peers',
            'Scanning grid',
            'Scoring pockets',
            'Drawing',
        ]);
        try {
            progress.step(0);
            const resolved = await resolveArea(params.area, state);

            if (!resolved) {
                progress.done();
                return { error: `Could not resolve "${params.area}" to an area. Try a more specific name.` };
            }
            const { geometry: area } = resolved;
            const { colocation } = params;
            const prefs = getSitePreferences(state);
            const radius = params.walkRadiusMeters ?? prefs.walkReachMeters;
            // User-supplied demand points (from a BYOD layer) augment the searched anchor demand.
            const byodDemandPoints = params.demandByodEntryId
                ? byodCandidateSites(requireByodFeatures(state, params.demandByodEntryId))
                : [];
            const byodDemandPositions = byodDemandPoints.map((point) => point.position);

            progress.step(1);

            const anchorsRaw = await resolveCategoriesWithNames(params.demandAnchors ?? prefs.demandAnchors);
            const targets = await resolveCategoriesWithNames(params.targetCategories);
            // The peer concept must never count as its own demand — drop target categories from anchors.
            const targetCodes = new Set<string>(targets.codes);
            const anchors = {
                codes: anchorsRaw.codes.filter((code) => !targetCodes.has(code)),
                names: anchorsRaw.names.filter((_, index) => !targetCodes.has(anchorsRaw.codes[index])),
            };
            const anchorFeatures = await searchInGeometry(area, {
                poiCategories: anchors.codes,
                query: 'shop',
                limit: SEARCH_LIMIT,
            });
            const targetFeatures = await searchInGeometry(area, {
                poiCategories: targets.codes,
                query: params.targetCategories.join(' '),
                limit: SEARCH_LIMIT,
            });

            // Whether any competitors exist in the area — affects how peer proximity is scored.
            const hasTargets = targetFeatures.length > 0;
            // Optional residential-density signal for resident-serving concepts (daycare, pharmacy, …).
            const addresses = params.householdDemand ? await searchAddresses(area) : { features: [], capped: false };

            progress.step(2);
            const bbox = turf.bbox(area) as [number, number, number, number];
            const { grid, cellSizeMeters } = buildGrid(bbox, resolved.km2, params.cellSizeMeters);
            if (grid.features.length > MAX_GRID_CELLS) {
                progress.done();
                return {
                    error: `That area at ${cellSizeMeters} m cells is ${grid.features.length} cells — too many. Use a larger cellSizeMeters.`,
                };
            }
            const { candidates, allHexes } = buildCandidates(grid, area, {
                radius,
                householdDemand: params.householdDemand,
                anchorFeatures,
                byodDemandPositions,
                addresses,
                targetFeatures,
            });

            progress.step(3);
            const { top, ranges } = await rankPockets(candidates, params, radius, hasTargets, colocation);

            progress.step(4);
            const { demandLegend, demandComposition } = await renderWhitespace(
                state,
                params,
                resolved,
                area,
                bbox,
                top,
                allHexes,
                anchorFeatures,
                byodDemandPoints,
                targetFeatures,
            );

            const goalMet = (pocket: ScoredPocket): boolean =>
                colocation === 'avoid' ? pocket.beyondWalk : pocket.nearestTargetMeters !== null && !pocket.beyondWalk;
            const gapCount = top.filter(goalMet).length;
            // Prefer the resolved friendly category name(s) over the raw input ("FITNESS_CLUB_CENTER").
            const peers = targets.names.length ? targets.names.join('/') : params.targetCategories.join('/');
            const warnings = buildWarnings(params, resolved, cellSizeMeters, targets, targetFeatures, addresses.capped);
            const { pockets, hexes } = buildPockets(top, ranges, hasTargets, colocation, anchorFeatures);
            publishWhitespace({
                area: resolved.label ?? '',
                areaKm2: resolved.km2,
                colocation,
                // No "(genuine gap)" suffix — it would clash with the "No genuine gaps" empty-state.
                goal:
                    colocation === 'avoid'
                        ? `no ${peers} within ${radius} m`
                        : `a ${peers} within ${radius} m`,
                targetMatchedBy: targets.names.length
                    ? `categories: ${targets.names.join(', ')}`
                    : 'name match (no category resolved)',
                anchorsMatchedBy:
                    (anchors.codes.length
                        ? `categories: ${anchors.names.join(', ')}`
                        : 'generic high-street fallback') +
                    (ranges.useHouseholdSignal ? ' + residential address density' : ''),
                pocketsMeetingGoal: gapCount,
                pockets,
                hexes,
                demandLegend,
                demandComposition,
                warnings,
            });
            progress.done();
            const goalWord = colocation === 'avoid' ? 'genuine gap' : 'in-cluster pocket';
            // Honest framing for saturated areas: if NOTHING clears the goal, the agent must say so
            // rather than calling busy-but-served spots "gaps" or "sparse".
            const hint =
                gapCount === 0
                    ? `IMPORTANT: NONE of these pockets is a ${goalWord} — every one already has a ${peers} within ${radius} m, so ${resolved.label} is already well-served for this. Say that plainly in ONE sentence; these are only the LEAST-served busy spots, NOT gaps — do not call them "sparse". Refer to pockets by colour/number; do not restate scores or coordinates.`
                    : `${gapCount} of ${pockets.features.length} pockets is a ${goalWord}${gapCount === 1 ? '' : 's'}; the rest are only least-served. Lead with that count in ONE sentence and don't oversell the non-gaps. Refer to pockets by colour/number; do not restate scores or coordinates.`;
            return {
                ok: true as const,
                panel: 'Opportunities',
                headline: `Scanned ${resolved.label} for ${peers} — ${pockets.features.length} pocket${pockets.features.length === 1 ? '' : 's'}, ${gapCount} ${goalWord}${gapCount === 1 ? '' : 's'}.`,
                hint,
            };
        } catch (error) {
            progress.done();
            return { error: `Whitespace scan failed: ${error instanceof Error ? error.message : String(error)}` };
        }
    }) as ToolEntry['execute'],
    examplePrompts: [
        'Where in Amsterdam Oost is there demand but no gym within a 10-minute walk?',
        'Find opportunity zones for a coffee shop in De Pijp',
        'Best spots for a furniture showroom that clusters near other furniture stores',
        'Find under-served areas for a daycare in Amsterdam West, near schools and supermarkets',
        'Where in the centre should a specialty bike shop open to be near other sports retailers?',
        'Show the best pockets for a pharmacy in Nieuw-West where residents are under-served',
    ],
};
