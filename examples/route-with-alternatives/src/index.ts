import {
    bboxFromGeoJSON,
    compareRoutes,
    formatDistance,
    formatDuration,
    getImportantRoads,
    type Route,
    type SectionsWithin,
    TomTomConfig,
    type TrafficIncidentCategory,
} from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

// A road the route follows for less than this on its own isn't worth naming.
const MIN_ROAD_LENGTH_IN_METERS = 2000;

// What a driver weighs between two routes, each as a chip naming it and the sections to ring.
type Chip = { text: string; sections: { id: string }[] };
const WEIGHED_TYPES = ['ferry', 'carTrain', 'toll', 'traffic', 'unpaved'] as const;
const weighed = ({ ferry, carTrain, toll, traffic, unpaved }: SectionsWithin): Chip[] => {
    const incidents = traffic?.sections ?? [];
    const ofCategory = (category: TrafficIncidentCategory) =>
        incidents.filter((incident) => incident.categories.includes(category));
    // A closure delays no one, it turns the traffic away, so it is named rather than timed.
    const closures = ofCategory('road-closed');
    const roadworks = ofCategory('roadworks');
    const jams = incidents.filter((incident) => incident.delayInSeconds);
    // Only the part of each jam on the roads compared counts, as the other route sits in the rest.
    const delayInSeconds = incidents.reduce(
        (total, incident, index) => total + (incident.delayInSeconds ?? 0) * (traffic?.shares[index] ?? 0),
        0,
    );

    const chips: Chip[] = [];
    if (ferry) chips.push({ text: `ferry ${formatDistance(ferry.lengthInMeters)}`, sections: ferry.sections });
    if (carTrain) {
        chips.push({ text: `car train ${formatDistance(carTrain.lengthInMeters)}`, sections: carTrain.sections });
    }
    if (toll) chips.push({ text: `toll ${formatDistance(toll.lengthInMeters)}`, sections: toll.sections });
    if (closures.length) {
        const text = closures.length === 1 ? 'road closure' : `${closures.length} road closures`;
        chips.push({ text, sections: closures });
    }
    if (roadworks.length) chips.push({ text: 'roadworks', sections: roadworks });
    if (delayInSeconds >= 60) chips.push({ text: `${formatDuration(delayInSeconds)} of traffic`, sections: jams });
    if (unpaved) chips.push({ text: `unpaved ${formatDistance(unpaved.lengthInMeters)}`, sections: unpaved.sections });
    return chips;
};

(async () => {
    const waypoints = await Promise.all(['London', 'Paris'].map(geocodeOne));
    const bounds = bboxFromGeoJSON(waypoints);
    const fitBoundsOptions = { padding: 150 };

    const map = new TomTomMap({
        mapLibre: {
            bounds,
            fitBoundsOptions,
            container: 'sdk-map',
        },
    });

    // The route typical traffic would take, created first so it draws under the live routes.
    const usualModule = await RoutingModule.create(map, { color: '#8E6BD1', summaryBubbles: { visible: false } });
    const routingModule = await RoutingModule.create(map);
    routingModule.showWaypoints(waypoints);
    const routes = await calculateRoute({
        locations: waypoints,
        maxAlternatives: 2,
        guidance: { type: 'coded' },
    });
    routingModule.showRoutes(routes);

    // Calculated once, when first asked for: it still carries the live traffic along it, such as the
    // closures and jams the live routes avoid.
    let usualRoute: Promise<Route> | undefined;
    const getUsualRoute = () =>
        (usualRoute ??= calculateRoute({ locations: waypoints, costModel: { traffic: 'historical' } }).then(
            (usual) => usual.features[0],
        ));

    // The roads no other route takes, which is what sets each route apart.
    const ownSectionIds = routes.features.map((route) =>
        (route.properties.sections.distinct ?? []).map((section) => section.id),
    );

    // A chip rings what it names, on the usual route for what that one takes, and leaving it rings
    // the roads its route has to itself again.
    const chipOf = (text: string, sections: { id: string }[], routeIndex: number, onUsualRoute = false) => {
        const chip = document.createElement('span');
        chip.className = 'ui-road-chip';
        chip.textContent = text;
        const sectionIds = sections.map((section) => section.id);
        chip.addEventListener('mouseenter', () => {
            void routingModule.setSectionFocus(onUsualRoute ? null : sectionIds);
            void usualModule.setSectionFocus(onUsualRoute ? sectionIds : null);
        });
        chip.addEventListener('mouseleave', () => {
            void routingModule.setSectionFocus(ownSectionIds[routeIndex]);
            void usualModule.setSectionFocus(null);
        });
        return chip;
    };

    const routeCards = document.querySelector('#ui-route-cards') as HTMLElement;
    const cards = routes.features.map((route, index) => {
        // Absent when the route came back alone, with no other route to tell it apart from.
        const ownSections = route.properties.sections.distinct;
        const ownMeters = (ownSections ?? []).reduce((total, section) => total + section.lengthInMeters, 0);

        const title = document.createElement('strong');
        title.textContent = index === 0 ? 'Recommended' : `Alternative ${index}`;
        const detail = document.createElement('span');
        detail.className = 'ui-route-card-detail';
        const duration = formatDuration(route.properties.summary.travelTimeInSeconds);
        detail.textContent = ownMeters ? `${duration} · ${formatDistance(ownMeters)} of its own` : duration;
        const card = document.createElement('button');
        card.className = 'ui-option-card ui-route-card';
        card.append(title, detail);

        if (ownSections) {
            // The motorways and main roads along them, which name what sets the route apart.
            const ownRoads = getImportantRoads(route, {
                within: ownSections,
                minLengthInMeters: MIN_ROAD_LENGTH_IN_METERS,
            }).filter((road) => road.name);
            const roads = document.createElement('span');
            roads.className = 'ui-route-card-roads';
            if (ownRoads.length) {
                roads.append('via ', ...ownRoads.map((road) => chipOf(road.name ?? '', road.sections, index)));
            } else {
                roads.textContent = ownSections.length ? 'via minor roads' : 'no road of its own';
            }
            card.append(roads);
        }

        const compare = document.createElement('span');
        compare.className = 'ui-route-card-compare';
        card.append(compare);

        card.addEventListener('click', () => selectRoute(index));
        card.addEventListener('mouseenter', () => pointAtRoute(index));
        card.addEventListener('mouseleave', () => pointAtRoute(undefined));
        routeCards.append(card);
        return { card, compare };
    });

    // Pointing at a route, on the map or at its card, widens its outline as a hover on the map does,
    // marks its card and rings the roads it has to itself. A line hovered on the map holds `hover` already,
    // and putting it again would redraw every route. Its bubble takes that `hover` away from the line.
    let pointedIndex: number | undefined;
    let pointedOnLine = false;
    const pointAtRoute = (index: number | undefined, lineHovered = false) => {
        if (index === pointedIndex && lineHovered === pointedOnLine) return;
        pointedIndex = index;
        pointedOnLine = lineHovered;
        cards.forEach(({ card }, cardIndex) => card.classList.toggle('ui-hovered', cardIndex === index));
        if (index === undefined) {
            routingModule.clearEventStates({ states: ['hover'] });
            void routingModule.setSectionFocus(null);
        } else {
            if (!lineHovered) routingModule.setEventState({ index, state: 'hover' });
            void routingModule.setSectionFocus(ownSectionIds[index]);
        }
    };

    // Each card weighs its route against the reference: the selected route, which the other cards
    // compare with, or the usual route, which tells what live traffic made every route avoid.
    const compareUsual = document.querySelector('#ui-compare-usual') as HTMLInputElement;
    let selectedIndex = 0;
    const compareWithReference = async () => {
        const usual = compareUsual.checked
            ? await getUsualRoute().catch(() => {
                  // Turned off, to be asked again on the next toggle.
                  usualRoute = undefined;
                  compareUsual.checked = false;
                  return undefined;
              })
            : undefined;
        // The toggle moved while the usual route was on its way: the call that move made draws instead.
        if (Boolean(usual) !== compareUsual.checked) return;

        if (usual) usualModule.showRoutes({ type: 'FeatureCollection', features: [usual] });
        else usualModule.clearRoutes();

        const reference = usual ?? routes.features[selectedIndex];
        cards.forEach(({ compare }, index) => {
            compare.hidden = !usual && index === selectedIndex;
            if (compare.hidden) return;

            const comparison = compareRoutes(routes.features[index], reference, { types: WEIGHED_TYPES });
            const [adds, avoids] = [weighed(comparison.adds), weighed(comparison.avoids)];
            compare.replaceChildren(usual ? 'vs usual route: ' : 'vs selected: ');
            if (!comparison.distinct.length && !comparison.referenceDistinct.length) {
                compare.append('same roads');
                return;
            }
            const chipsOf = (chips: Chip[], onUsualRoute = false) =>
                chips.map(({ text, sections }) => chipOf(text, sections, index, onUsualRoute));
            if (adds.length) compare.append('adds ', ...chipsOf(adds));
            if (avoids.length) compare.append('avoids ', ...chipsOf(avoids, Boolean(usual)));
            if (!adds.length && !avoids.length) compare.append('same tolls, crossings and traffic');
        });
    };
    compareUsual.addEventListener('change', () => void compareWithReference());

    const selectRoute = (index: number) => {
        selectedIndex = index;
        routingModule.selectRoute(index);
        cards.forEach(({ card }, cardIndex) => card.classList.toggle('active', cardIndex === index));
        void compareWithReference();
    };
    cards[0].card.classList.add('active');
    void compareWithReference();

    // A click on a route or its bubble selects it too.
    routingModule.events.mainLines.on('click', (route) => selectRoute(route.properties.index));
    routingModule.events.summaryBubbles.on('click', (summary) => selectRoute(summary.properties.routeIndex));
    routingModule.events.mainLines.on('hover', (route) => pointAtRoute(route.properties.index, true));
    routingModule.events.summaryBubbles.on('hover', (summary) => pointAtRoute(summary.properties.routeIndex));

    // No event says the pointer left a route, so a hover on the base map under it, or leaving the map, ends it.
    // The base map's labels, shields and 3D buildings stay out: drawn above the routes, they'd end a hover on one.
    // The waypoint pins have no handler, so a hover over one reaches the route or the map below it.
    const baseMap = await BaseMapModule.get(map, { events: { cursorOnHover: 'default' } });
    baseMap.events
        .where({
            layerGroups: {
                show: 'only',
                values: ['land', 'water', 'buildings2D', 'roads', 'railways', 'ferries', 'borders'],
            },
        })
        .on('hover', () => pointAtRoute(undefined));
    map.mapLibreMap.on('mouseout', () => pointAtRoute(undefined));

    initTogglePanel();
})();
