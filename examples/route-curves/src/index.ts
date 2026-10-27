import {
    bboxFromCoordsArray,
    bboxFromGeoJSON,
    type CurveDetectionOptions,
    type CurveSectionProps,
    type CurvyStretchSectionProps,
    formatDistance,
    formatDuration,
    getProgressAtNearestRoutePoint,
    getRouteProgressForSection,
    getSectionOverlap,
    getSectionsWithin,
    isHairpin,
    type Route,
    type RouteSpan,
    type Routes,
    TomTomConfig,
    withCurveSections,
} from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import {
    calculateRoute,
    createLatestRequest,
    type ReverseGeocodingResponse,
    reverseGeocode,
} from '@tomtom-org/maps-sdk/services';
import { Popup } from 'maplibre-gl';
import { API_KEY } from './config';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

const INNSBRUCK_TO_BOLZANO: [number, number][] = [
    [11.3933, 47.2692],
    [11.3548, 46.4983],
];

// Room on the right for the panel, so the routes frame themselves beside it.
const FIT_PADDING = { top: 80, bottom: 80, left: 80, right: 400 };

type Mood = 'avoid' | 'seek';

const countOf = (count: number, singular: string, plural = `${singular}s`): string =>
    `${count} ${count === 1 ? singular : plural}`;

// How hard a curve is for the road it's on, as the map's rose deepens with it.
const severityOf = ({ severity }: CurveSectionProps): string => {
    if (severity < 0.25) return 'gentle';

    if (severity < 0.5) return 'moderate';

    return severity < 0.75 ? 'sharp' : 'severe';
};

type Curves = { curve: CurveSectionProps[]; curvyStretch: CurvyStretchSectionProps[] };

// The curves and curvy stretches with more than `minShare` of their length within the spans, such as the route's
// towns or tunnels: by default, any that reach into them.
const curvesWithin = (route: Route, spans: readonly RouteSpan[] = [], minShare = 0): Curves => {
    const { curve, curvyStretch } = getSectionsWithin(route, { within: spans, types: ['curve', 'curvyStretch'] });
    const sharing = <S>(found?: { sections: S[]; shares: number[] }): S[] =>
        found?.sections.filter((_, index) => found.shares[index] > minShare) ?? [];
    return { curve: sharing(curve), curvyStretch: sharing(curvyStretch) };
};

// The sections sharing no stretch with any of the spans.
const clearOf = <S extends RouteSpan>(sections: S[] = [], spans: readonly RouteSpan[] = []): S[] =>
    sections.filter((section) => !spans.some((span) => getSectionOverlap(section, span)));

type Context = 'all' | 'openRoad' | 'townTurns' | 'distinct' | 'tunnels' | 'hairpins';

type ContextView = {
    // The curves and curvy stretches the map draws on the route.
    curvesOf: (route: Route) => Curves;
    // What a route card counts of them.
    detailOf: (curves: Curves) => string;
};

const CONTEXTS: Record<Context, ContextView> = {
    all: {
        curvesOf: ({ properties: { sections } }) => ({
            curve: sections.curve ?? [],
            curvyStretch: sections.curvyStretch ?? [],
        }),
        detailOf: ({ curve }) => countOf(curve.length, 'curve'),
    },
    // Bends outside towns with no junction to slow down for: the roads to ride.
    openRoad: {
        curvesOf: ({ properties: { sections } }) => ({
            curve: clearOf(sections.curve, sections.urban).filter((curve) => !curve.maneuver),
            curvyStretch: clearOf(sections.curvyStretch, sections.urban),
        }),
        detailOf: ({ curve }) => countOf(curve.length, 'open-road bend'),
    },
    // Turns at junctions through a town, the maneuvers to take among traffic.
    townTurns: {
        curvesOf: (route) => ({
            curve: curvesWithin(route, route.properties.sections.urban).curve.filter((curve) => curve.maneuver),
            curvyStretch: [],
        }),
        detailOf: ({ curve }) => `${countOf(curve.length, 'turn')} in towns`,
    },
    // The winding roads no other route drives, which set the alternatives apart. A stretch counts when most of it is
    // the route's own, not when it runs on a little past the fork from a road the alternatives share.
    distinct: {
        curvesOf: (route) => curvesWithin(route, route.properties.sections.distinct, 0.5),
        detailOf: ({ curvyStretch }) =>
            `${countOf(curvyStretch.length, 'curvy stretch', 'curvy stretches')} of its own`,
    },
    // Curves where the road can't be seen ahead, nor the oncoming traffic.
    tunnels: {
        curvesOf: (route) => ({ curve: curvesWithin(route, route.properties.sections.tunnel).curve, curvyStretch: [] }),
        detailOf: ({ curve }) => `${countOf(curve.length, 'curve')} in tunnels`,
    },
    // The hairpins and the curvy stretches they're on.
    hairpins: {
        curvesOf: ({ properties: { sections } }) => ({
            curve: sections.curve?.filter(isHairpin) ?? [],
            curvyStretch: sections.curvyStretch?.filter((stretch) => stretch.hairpinCount) ?? [],
        }),
        detailOf: ({ curve }) => countOf(curve.length, 'hairpin'),
    },
};

// How long a route drives in its curves, and how far: its share of the drive's time says how winding it is.
const inCurves = (route: Route) => {
    let seconds = 0;
    let meters = 0;
    for (const curve of route.properties.sections.curve ?? []) {
        seconds += getRouteProgressForSection(route, curve)?.delta.travelTimeInSeconds ?? 0;
        meters += curve.lengthInMeters;
    }
    return { seconds, meters, share: seconds / route.properties.summary.travelTimeInSeconds };
};

// A slider of the panel, which prints its value beside it as it moves.
const slider = (id: string, format: (value: number) => string): HTMLInputElement => {
    const input = document.querySelector(`#ui-${id}`) as HTMLInputElement;
    const value = input.nextElementSibling as HTMLElement;
    const show = () => {
        value.textContent = format(input.valueAsNumber);
    };
    input.addEventListener('input', show);
    show();
    return input;
};

// Until the straight slider moves, the SDK's own default holds, which widens with the radius.
let straightMoved = false;
document.querySelector('#ui-maxStraight')?.addEventListener('input', () => (straightMoved = true), { once: true });

const thresholds = {
    minTurn: slider('minTurn', (degrees) => `${degrees}°`),
    maxRadius: slider('maxRadius', formatDistance),
    maxStraight: slider('maxStraight', (meters) => (straightMoved ? formatDistance(meters) : 'Auto')),
    minCurveCount: slider('minCurveCount', String),
    maxGap: slider('maxGap', formatDistance),
};

// What the sliders say counts as a curve and as a curvy stretch.
const curveDetection = (): CurveDetectionOptions => ({
    curve: {
        minHeadingChangeInDegrees: thresholds.minTurn.valueAsNumber,
        maxRadiusInMeters: thresholds.maxRadius.valueAsNumber,
        ...(straightMoved && { maxStraightInMeters: thresholds.maxStraight.valueAsNumber }),
    },
    curvyStretch: {
        minCurveCount: thresholds.minCurveCount.valueAsNumber,
        maxGapInMeters: thresholds.maxGap.valueAsNumber,
    },
});

const withDetection = (planned: Routes, detection: CurveDetectionOptions): Routes => ({
    ...planned,
    features: planned.features.map((route) => withCurveSections(route, detection)),
});

// Curves band the route over the curvy stretches they make up, both off by default. A context draws only its own, as
// the routes are shown again with those alone.
const ROUTING_CONFIG = { sections: { curve: { visible: true }, curvyStretch: { visible: true } } };

const isContext = (value: string): value is Context => value in CONTEXTS;

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromCoordsArray(INNSBRUCK_TO_BOLZANO),
            fitBoundsOptions: { padding: FIT_PADDING },
        },
    });

    let context: Context = 'all';
    const routingModule = await RoutingModule.create(map, ROUTING_CONFIG);
    await routingModule.showWaypoints(INNSBRUCK_TO_BOLZANO);

    const routeCards = document.querySelector('#ui-route-cards') as HTMLElement;
    const cards = new Map<number, HTMLButtonElement>();
    const popup = new Popup({ closeButton: false, className: 'ui-maplibre-popup' });
    let routes: Routes | undefined;
    let straightestFirst: Route[] = [];
    let selectedIndex = 0;

    const markSelected = () => cards.forEach((card, index) => card.classList.toggle('active', index === selectedIndex));

    const stretchPanel = document.querySelector('#ui-stretch') as HTMLElement;
    const stretchTitle = document.querySelector('#ui-stretch-title') as HTMLElement;
    const stretchPlaces = document.querySelector('#ui-stretch-places') as HTMLElement;
    const stretchAlong = document.querySelector('#ui-stretch-along') as HTMLElement;
    const stretchShape = document.querySelector('#ui-stretch-shape') as HTMLElement;
    const selectedRoute = () => routes?.features.find((route) => route.properties.index === selectedIndex);
    // The stretches the selected route draws, which are the ones to click or step through.
    const shownStretches = () => {
        const route = selectedRoute();
        return route ? CONTEXTS[context].curvesOf(route).curvyStretch : [];
    };
    let stretch: CurvyStretchSectionProps | undefined;
    // A newer stretch supersedes the places still being looked up for the one before.
    const latestPlaces = createLatestRequest();
    const placeName = ({ properties }: ReverseGeocodingResponse) =>
        properties && (properties.address.municipality ?? properties.address.freeformAddress);

    const selectStretch = async (picked: CurvyStretchSectionProps | undefined) => {
        stretch = picked;
        void routingModule.setSectionFocus(picked ? [picked.id] : null);
        stretchPanel.hidden = !shownStretches().length;
        const route = selectedRoute();
        if (!picked || !route) {
            latestPlaces.cancel();
            stretchTitle.textContent = 'Click a curvy stretch, or step through them';
            stretchPlaces.textContent = stretchAlong.textContent = stretchShape.textContent = '';
            return;
        }

        const progress = getRouteProgressForSection(route, picked);
        stretchTitle.textContent = `${picked.curveCount} curves in ${formatDistance(picked.lengthInMeters)}`;
        stretchAlong.textContent = progress
            ? `${formatDistance(progress.start.distanceInMeters)} into the route, ${formatDuration(progress.delta.travelTimeInSeconds)} to drive`
            : '';
        stretchShape.textContent = [
            ...(picked.hairpinCount ? [countOf(picked.hairpinCount, 'hairpin')] : []),
            `one every ${formatDistance(picked.lengthInMeters / picked.curveCount)}`,
            `tightest radius ${formatDistance(picked.minRadiusInMeters)}`,
            `curviness ${Math.round(picked.curvinessScore)}`,
        ].join(', ');
        stretchPlaces.textContent = '…';
        // Framed on every point: a winding stretch strays outside `getSectionBBox`'s sampled box.
        const stretchCoordinates = route.geometry.coordinates.slice(picked.startPointIndex, picked.endPointIndex + 1);
        const stretchBBox = bboxFromCoordsArray(stretchCoordinates);
        if (stretchBBox) map.mapLibreMap.fitBounds(stretchBBox, { padding: FIT_PADDING, maxZoom: 14 });

        const { coordinates } = route.geometry;
        const ends = await latestPlaces.run((signal) =>
            Promise.all(
                [picked.startPointIndex, picked.endPointIndex].map((index) =>
                    reverseGeocode({ position: coordinates[index], geographyTypes: ['Municipality'], signal }),
                ),
            ),
        );
        if (!ends.current) return;

        const [from, to] = ends.value.map(placeName);
        if (!from || !to) {
            stretchPlaces.textContent = '';
        } else {
            stretchPlaces.textContent = from === to ? `In ${from}` : `From ${from} to ${to}`;
        }
    };

    const stepStretch = (step: 1 | -1) => {
        const stretches = shownStretches();
        if (!stretches.length) return;

        const at = stretches.findIndex((candidate) => candidate.id === stretch?.id);
        const next = at < 0 ? (step > 0 ? 0 : stretches.length - 1) : (at + step + stretches.length) % stretches.length;
        void selectStretch(stretches[next]);
    };

    // Only the selected route draws its curves, so a popup on another route's curve would point at nothing.
    const selectRoute = (index: number) => {
        selectedIndex = index;
        popup.remove();
        void routingModule.selectRoute(index);
        void selectStretch(undefined);
        markSelected();
    };

    const cardOf = (route: Route): HTMLButtonElement => {
        const { index, summary } = route.properties;
        const { curvesOf, detailOf } = CONTEXTS[context];

        const { seconds, meters, share } = inCurves(route);
        const line = (className: string, text: string, tag = 'span') => {
            const element = document.createElement(tag);
            element.className = className;
            element.textContent = text;
            return element;
        };

        const card = document.createElement('button');
        card.className = 'ui-option-card ui-route-card';
        card.append(
            line('ui-route-card-title', `${Math.round(share * 100)}% in curves`, 'strong'),
            line(
                'ui-route-card-detail ui-route-card-in-curves',
                `${formatDuration(seconds)} and ${formatDistance(meters)} of the drive`,
            ),
            line(
                'ui-route-card-detail ui-route-card-totals',
                [
                    formatDuration(summary.travelTimeInSeconds),
                    formatDistance(summary.lengthInMeters),
                    detailOf(curvesOf(route)),
                ].join(' · '),
            ),
        );
        card.addEventListener('click', () => selectRoute(index));
        cards.set(index, card);
        return card;
    };

    // Each route shown keeps only the curves and stretches of the context, so the map draws those alone.
    const showCurves = async () => {
        if (!routes) return;

        const { curvesOf } = CONTEXTS[context];
        await routingModule.showRoutes(
            {
                ...routes,
                features: routes.features.map((route) => ({
                    ...route,
                    properties: {
                        ...route.properties,
                        sections: { ...route.properties.sections, ...curvesOf(route) },
                    },
                })),
            },
            { selectedIndex },
        );
        cards.clear();
        routeCards.replaceChildren(...straightestFirst.map(cardOf));
        markSelected();
        await selectStretch(undefined);
    };

    const rankRoutes = () => {
        straightestFirst = [...(routes?.features ?? [])].sort(
            (first, second) => inCurves(first).share - inCurves(second).share,
        );
    };

    // The routes already planned find their curves again, with no new request, and keep the route selected.
    const detectCurvesAgain = async () => {
        if (!routes) return;

        routes = withDetection(routes, curveDetection());
        rankRoutes();
        popup.remove();
        await showCurves();
    };

    // A newer pick supersedes a plan still on its way, so the map never ends on a route the panel doesn't name.
    const latestPlan = createLatestRequest();
    const showRoutesFor = async (mood: Mood) => {
        // A thrilling route takes the winding roads a fast one keeps off.
        const routeType = mood === 'seek' ? 'thrilling' : 'fast';
        const requested = curveDetection();
        const plan = await latestPlan.run((signal) =>
            calculateRoute({
                locations: INNSBRUCK_TO_BOLZANO,
                maxAlternatives: 2,
                costModel: { routeType },
                // Curves are found only when asked for. The towns and tunnels are what they're read against, and the
                // speed limits say how hard each curve is for the road it's on.
                sectionTypes: ['curve', 'curvyStretch', 'urban', 'tunnel', 'speedLimit'],
                curveDetection: requested,
                // Its instructions mark the curves that are turns at a junction rather than bends of the road.
                guidance: { type: 'coded' },
                signal,
            }),
        );
        if (!plan.current) return;

        // When a slider moved while the plan was on its way, its curves are found again with what the sliders say now.
        const detection = curveDetection();
        routes =
            JSON.stringify(detection) === JSON.stringify(requested) ? plan.value : withDetection(plan.value, detection);
        rankRoutes();
        const picked = mood === 'seek' ? straightestFirst[straightestFirst.length - 1] : straightestFirst[0];
        selectedIndex = picked.properties.index;
        popup.remove();
        const routesBBox = bboxFromGeoJSON(routes);
        if (routesBBox) map.mapLibreMap.fitBounds(routesBBox, { padding: FIT_PADDING });
        await showCurves();
    };

    // Only the selected route draws its sections, so the curve clicked is one of its own.
    routingModule.events.curveSections.on('click', (feature, lngLat) => {
        const curve = routes?.features
            .flatMap((route) => route.properties.sections.curve ?? [])
            .find((candidate) => candidate.id === feature.properties.id);
        if (!curve) return;

        const kind = curve.maneuver ? 'Turn at a junction' : 'Bend';
        const side = curve.headingChangeInDegrees > 0 ? 'right' : 'left';
        const turn = Math.round(Math.abs(curve.headingChangeInDegrees));
        popup
            .setLngLat(lngLat)
            .setText(
                `${kind}: ${turn}° to the ${side}, ${formatDistance(curve.radiusInMeters)} radius, ${severityOf(curve)}`,
            )
            .addTo(map.mapLibreMap);
    });
    // The selected route's line and its curves draw over the curvy stretch band and take its clicks, so the click is
    // snapped onto the route instead: a click anywhere along a stretch picks it.
    routingModule.events.on('click', (top, lngLat) => {
        const route = selectedRoute();
        if (!route || top.properties.routeState === 'deselected') return;

        const along = getProgressAtNearestRoutePoint(route, [lngLat.lng, lngLat.lat])?.distanceInMeters;
        if (along === undefined) return;

        const picked = shownStretches().find((candidate) => {
            const progress = getRouteProgressForSection(route, candidate);
            return progress && progress.start.distanceInMeters <= along && along <= progress.end.distanceInMeters;
        });
        if (picked) void selectStretch(picked);
    });
    // Only the alternatives take a click: a click along the selected line picks the stretch under it.
    routingModule.events.mainLines
        .where((route) => route.properties.routeState === 'deselected')
        .on('click', ({ properties: { index } }) => selectRoute(index));
    document.querySelector('#ui-stretch-previous')?.addEventListener('click', () => stepStretch(-1));
    document.querySelector('#ui-stretch-next')?.addEventListener('click', () => stepStretch(1));

    for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="ui-mood"]')) {
        radio.addEventListener('change', () => void showRoutesFor(radio.value === 'seek' ? 'seek' : 'avoid'));
    }
    for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="ui-context"]')) {
        radio.addEventListener('change', () => {
            if (!isContext(radio.value)) return;

            context = radio.value;
            popup.remove();
            void showCurves();
        });
    }
    for (const input of Object.values(thresholds)) {
        input.addEventListener('change', () => void detectCurvesAgain());
    }
    await showRoutesFor('seek');
})();
