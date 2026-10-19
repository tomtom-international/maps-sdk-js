import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { getImportantRoads, type Route, type Routes } from '@tomtom-org/maps-sdk/core';
import type { ReactNode } from 'react';
import { clockTime, distance, duration, placeTitle } from '../format';
import { filledStops, type Stop, stopBadge } from '../planner/stops';
import { type LaneId, laneLook, lanesCrossed } from '../sections/routeLanes';
import { Hint } from './fields';
import './stop.css';
import './TripSummary.css';

type TripSummaryProps = {
    routes: Routes;
    selectedIndex: number;
    onSelect: (index: number) => void;
    /** The route pointed at, on the map or in the panel. */
    pointedIndex?: number;
    /** The route pointed at in the panel, with the sections to ring on it when only some of it is, or none. */
    onPointAtRoute: (index?: number, sectionIds?: string[]) => void;
    stops: Stop[];
    /** The leg of the drive pointed at in the itinerary, by id, or none. */
    onPointAtLeg: (legId?: string) => void;
};

export const TripSummary = ({ routes, stops, onPointAtLeg, ...alternatives }: TripSummaryProps) => {
    const route = routes.features[alternatives.selectedIndex];
    return (
        <>
            {routes.features.length > 1 && <Alternatives routes={routes} {...alternatives} />}
            <RouteFacts route={route} />
            <Itinerary route={route} stops={stops} onPointAtLeg={onPointAtLeg} />
        </>
    );
};

const comparedToSelected = (minutes: number, isFastest: boolean): string => {
    if (minutes > 0) return ` · ${duration(minutes * 60)} slower`;
    if (minutes < 0) return ` · ${duration(-minutes * 60)} faster`;
    return isFastest ? ' · fastest' : '';
};

// A road the route follows for less than this on its own isn't worth naming.
const MIN_ROAD_LENGTH_IN_METERS = 2000;

type OwnRoadsProps = { route: Route; onPointAtRoad: (sectionIds?: string[]) => void };

/** The main roads only this route takes, which set it apart; pointing at one rings its stretches. */
const OwnRoads = ({ route, onPointAtRoad }: OwnRoadsProps) => {
    const ownSections = route.properties.sections.distinct ?? [];
    const roads = getImportantRoads(route, {
        within: ownSections,
        minLengthInMeters: MIN_ROAD_LENGTH_IN_METERS,
    }).filter((road) => road.name);
    if (!roads.length) {
        return (
            <span className="ui-alternative-roads">
                {ownSections.length ? 'via minor roads' : 'no road of its own'}
            </span>
        );
    }

    return (
        <span className="ui-alternative-roads">
            via{' '}
            {roads.map((road) => (
                <span
                    key={road.name}
                    className="ui-road-chip"
                    onPointerEnter={() => onPointAtRoad(road.sections.map((section) => section.id))}
                    onPointerLeave={() => onPointAtRoad(undefined)}
                >
                    {road.name}
                </span>
            ))}
        </span>
    );
};

const Alternatives = ({
    routes,
    selectedIndex,
    onSelect,
    pointedIndex,
    onPointAtRoute,
}: Omit<TripSummaryProps, 'stops' | 'onPointAtLeg'>) => {
    // Timed against the selected route, as the map's bubbles are, each duration rounded to the minute first.
    const minutesOf = (route: Route) => Math.round(route.properties.summary.travelTimeInSeconds / 60);
    const fastest = Math.min(...routes.features.map(minutesOf));
    const selectedMinutes = minutesOf(routes.features[selectedIndex]);
    return (
        <div className="ui-section">
            <h4 className="ui-subheading">Routes</h4>
            <ToggleGroup.Root
                type="single"
                className="ui-alternatives"
                aria-label="Routes"
                value={String(selectedIndex)}
                // Clicking the selected route again would unselect it: a route stays picked.
                onValueChange={(value) => value && onSelect(Number(value))}
            >
                {routes.features.map((route, index) => {
                    const { travelTimeInSeconds, lengthInMeters } = route.properties.summary;
                    const versusSelected = minutesOf(route) - selectedMinutes;
                    return (
                        <ToggleGroup.Item
                            key={route.id ?? index}
                            value={String(index)}
                            className={`ui-option-card ui-alternative${index === selectedIndex ? ' active' : ''}${
                                index === pointedIndex ? ' ui-hovered' : ''
                            }`}
                            onPointerEnter={() => onPointAtRoute(index)}
                            onPointerLeave={() => onPointAtRoute(undefined)}
                        >
                            <span className="ui-alternative-time">{duration(travelTimeInSeconds)}</span>
                            <span className="ui-alternative-detail">
                                {distance(lengthInMeters)}
                                {comparedToSelected(versusSelected, minutesOf(route) === fastest)}
                            </span>
                            <OwnRoads route={route} onPointAtRoad={(sectionIds) => onPointAtRoute(index, sectionIds)} />
                        </ToggleGroup.Item>
                    );
                })}
            </ToggleGroup.Root>
        </div>
    );
};

/** The road features a route crosses, which a driver may want to know about before leaving. */
const crossingLanes: LaneId[] = ['toll', 'ferry', 'tunnel', 'lowEmissionZone', 'carTrain', 'unpaved'];

const optionalDuration = (seconds?: number): string | undefined =>
    seconds === undefined ? undefined : duration(seconds);

const Crossings = ({ lanes }: { lanes: LaneId[] }) => (
    <span className="ui-crossings">
        {lanes.map((id) => {
            const { label, icon: Icon } = laneLook(id);
            return (
                <Hint key={id} label={label}>
                    <span className="ui-crossing">
                        {Icon && <Icon />}
                        <span className="ui-sr-only">{label}</span>
                    </span>
                </Hint>
            );
        })}
    </span>
);

const RouteFacts = ({ route }: { route: Route }) => {
    const { summary, sections } = route.properties;
    const waiting = sections.leg.reduce((total, leg) => total + (leg.summary.stopTimeInSeconds ?? 0), 0);
    const countries = [...new Set(sections.country?.map((country) => country.countryCodeISO2))];
    const crossings = lanesCrossed(route, crossingLanes);

    const facts: [string, ReactNode][] = [
        ['Depart', clockTime(summary.departureTime)],
        ['Arrive', clockTime(summary.arrivalTime)],
        ['Door to door', duration(summary.travelTimeInSeconds)],
        ['Driving', duration(summary.travelTimeInSeconds - waiting)],
        ['Staying', waiting ? duration(waiting) : undefined],
        ['Traffic delay', summary.trafficDelayInSeconds >= 60 ? duration(summary.trafficDelayInSeconds) : 'None'],
        ['Distance', distance(summary.lengthInMeters)],
        // The traffic scenarios come back only with `computeTravelTimeFor: 'all'`.
        ['Without traffic', optionalDuration(summary.noTrafficTravelTimeInSeconds)],
        ['Usual traffic', optionalDuration(summary.historicTrafficTravelTimeInSeconds)],
        ['Incidents only', optionalDuration(summary.liveTrafficIncidentsTravelTimeInSeconds)],
        ['Countries', countries.length > 1 ? countries.join(', ') : undefined],
        ['Crosses', crossings.length ? <Crossings lanes={crossings} /> : undefined],
    ];

    return (
        <div className="ui-section">
            <dl className="ui-detail-list">
                {facts
                    .filter(([, value]) => value)
                    .map(([term, value]) => (
                        <div key={term}>
                            <dt>{term}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
            </dl>
        </div>
    );
};

type ItineraryProps = Pick<TripSummaryProps, 'stops' | 'onPointAtLeg'> & { route: Route };

/** Each stop with when you get there and when you leave, and the drive in between, ringed on the map while pointed at. */
const Itinerary = ({ route, stops, onPointAtLeg }: ItineraryProps) => {
    const legs = route.properties.sections.leg;
    const filled = filledStops(stops);
    return (
        <div className="ui-section">
            <h4 className="ui-subheading">Itinerary</h4>
            <ol className="ui-itinerary">
                {filled.map(({ id, place, index }, position) => {
                    const arriving = legs[position - 1]?.summary;
                    const leavingLeg = legs[position];
                    const leaving = leavingLeg?.summary;
                    const stay = arriving?.stopTimeInSeconds;
                    return (
                        <li
                            key={id}
                            className="ui-itinerary-stop"
                            onPointerEnter={() => onPointAtLeg(leavingLeg?.id)}
                            onPointerLeave={() => onPointAtLeg(undefined)}
                        >
                            <span className="ui-stop-badge">{stopBadge(index, stops.length)}</span>
                            <div className="ui-itinerary-body">
                                <span className="ui-stop-title">{placeTitle(place)}</span>
                                <span className="ui-stop-subtitle">
                                    {arriving && `Arrive ${clockTime(arriving.arrivalTime)}`}
                                    {stay ? ` · stay ${duration(stay)}` : ''}
                                    {arriving && leaving && ' · '}
                                    {leaving && `Leave ${clockTime(leaving.departureTime)}`}
                                </span>
                                {leaving && (
                                    <span className="ui-itinerary-leg">
                                        {distance(leaving.lengthInMeters)} · {duration(leaving.travelTimeInSeconds)}{' '}
                                        drive
                                    </span>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};
