import * as ToggleGroup from '@radix-ui/react-toggle-group';
import {
    bboxFromCoordsArray,
    getCoordinateAtRouteProgress,
    type Route,
    type RouteCoordinateAtProgress,
} from '@tomtom-org/maps-sdk/core';
import { MapPin } from 'lucide-react';
import { Fragment, type MouseEvent, type PointerEvent, type ReactNode, useCallback, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { addSeconds, clockTime, distance, duration, placeTitle, progressInto } from '../format';
import { keysOf } from '../keysOf';
import { fitBetweenPanels } from '../map/coveringPanels';
import { type RouteCursorStore, useRouteCursor } from '../map/routeCursor';
import type { MapModules } from '../map/useMapModules';
import { type ChipLook, CollapseToggle, Hint } from '../panel/fields';
import { filledStops, type Stop, stopBadge } from '../planner/stops';
import { type Axis, axisFraction, type Lane, type LaneBlock, routeLanes, stopMarks } from './routeLanes';
import { SectionDetailsCard } from './SectionDetailsCard';
import '../panel/stop.css';
import './routeLanes.css';
import './RouteSectionsBar.css';

type RouteSectionsBarProps = {
    modules: MapModules;
    route: Route;
    stops: Stop[];
    cursorStore: RouteCursorStore;
    /** The section or leg pointed at, on the map, on the bar or in the panel, by id. */
    pointedSectionId?: string;
    onPointAtSection: (sectionId?: string) => void;
    /** The section clicked on the bar or on the map, by id, whose details show above the bar. */
    selectedSectionId?: string;
    onSelectSection: (sectionId?: string) => void;
};

const axisLabels: Record<Axis, string> = { time: 'Time', distance: 'Distance' };
const axes = keysOf(axisLabels);
const TICKS = [0, 0.25, 0.5, 0.75, 1];

const percent = (fraction: number) => `${(fraction * 100).toFixed(3)}%`;

/** The route as a strip, one lane per kind of section, hovered and clicked in step with the map. */
export const RouteSectionsBar = ({
    modules,
    route,
    stops,
    cursorStore,
    pointedSectionId,
    onPointAtSection,
    selectedSectionId,
    onSelectSection,
}: RouteSectionsBarProps) => {
    const [axis, setAxis] = useState<Axis>('time');
    const [collapsed, setCollapsed] = useState(false);
    const lanes = routeLanes(route);
    const blockById = (id?: string) => lanes.flatMap((lane) => lane.blocks).find((block) => block.id === id);
    const active = blockById(pointedSectionId);
    const selected = blockById(selectedSectionId);
    const closeDetails = useCallback(() => onSelectSection(undefined), [onSelectSection]);

    return (
        <>
            {selected && <SectionDetailsCard route={route} block={selected} onClose={closeDetails} />}
            <section className="ui-customPanel ui-sections-bar" aria-label="Route sections">
                <div className="ui-sections-header">
                    <h4 className="ui-subheading">Along the route</h4>
                    <Readout route={route} block={active} cursorStore={cursorStore} />
                    <AxisToggle axis={axis} onChange={setAxis} />
                    <CollapseToggle
                        label="Toggle the sections bar"
                        collapsed={collapsed}
                        onToggle={() => setCollapsed(!collapsed)}
                    />
                </div>
                {!collapsed && (
                    <div className="ui-sections-chart">
                        <ul className="ui-lane-labels">
                            <LaneLabel look={{ label: 'Stops', icon: MapPin }} />
                            {lanes.map((lane) => (
                                <LaneLabel key={lane.id} look={lane} />
                            ))}
                        </ul>
                        <LaneTracks
                            route={route}
                            axis={axis}
                            cursorStore={cursorStore}
                            onPickPoint={(point, reach) => {
                                // The fit measures the dock, so the details card must have left it first.
                                flushSync(() => onSelectSection(undefined));
                                zoomToPoint(modules, point, reach);
                            }}
                        >
                            <StopsLane route={route} axis={axis} stops={stops} />
                            {lanes.map((lane) => (
                                <SectionLane
                                    key={lane.id}
                                    lane={lane}
                                    route={route}
                                    axis={axis}
                                    activeId={active?.id}
                                    selectedId={selected?.id}
                                    onHover={onPointAtSection}
                                    onPick={(block) => {
                                        flushSync(() => onSelectSection(block.id));
                                        zoomToSection(modules, route, block);
                                    }}
                                />
                            ))}
                        </LaneTracks>
                    </div>
                )}
            </section>
        </>
    );
};

// Fitted to every point of the section: a winding one strays outside `getSectionBBox`'s sampled box.
const zoomToSection = (modules: MapModules, route: Route, block: LaneBlock) => {
    const { startPointIndex, endPointIndex } = block.section;
    const bbox = bboxFromCoordsArray(route.geometry.coordinates.slice(startPointIndex, endPointIndex + 1));
    if (bbox) fitBetweenPanels(modules.map, bbox, 15);
};

/**
 * Centres the point, zoomed to show the route as far as the reach either side of it. The box is
 * mirrored around the point, so fitting it keeps the point in the middle.
 */
const zoomToPoint = (modules: MapModules, point: RouteCoordinateAtProgress, reach: RouteCoordinateAtProgress[]) => {
    const [longitude, latitude] = point.position;
    const [halfWidth, halfHeight] = [longitude, latitude].map((center, axisIndex) =>
        Math.max(...reach.map(({ position }) => Math.abs(position[axisIndex] - center))),
    );
    fitBetweenPanels(
        modules.map,
        [longitude - halfWidth, latitude - halfHeight, longitude + halfWidth, latitude + halfHeight],
        16,
    );
};

/** A lane named by its icon, and in full on hover: the tracks get the width. */
const LaneLabel = ({ look: { label, icon: Icon } }: { look: ChipLook }) => (
    <Hint label={label}>
        <li>
            {Icon && <Icon />}
            <span className="ui-sr-only">{label}</span>
        </li>
    </Hint>
);

const AxisToggle = ({ axis, onChange }: { axis: Axis; onChange: (axis: Axis) => void }) => (
    <ToggleGroup.Root
        type="single"
        className="ui-button-group-segmented"
        aria-label="Bar scale"
        value={axis}
        onValueChange={(value) => {
            const picked = axes.find((id) => id === value);
            if (picked) onChange(picked);
        }}
    >
        {axes.map((id) => (
            <ToggleGroup.Item
                key={id}
                value={id}
                className={`ui-button ui-toggle ui-button-xs${axis === id ? ' active' : ''}`}
            >
                {axisLabels[id]}
            </ToggleGroup.Item>
        ))}
    </ToggleGroup.Root>
);

type LaneProps = { route: Route; axis: Axis };

/** How far either side of a clicked point the map shows the route, in pixels of the bar. */
const POINT_REACH_PX = 12;

/** Where on the route a share of the axis falls, a share outside the axis holding at its nearer end. */
const progressAt = (route: Route, axis: Axis, fraction: number) => {
    const share = Math.min(1, Math.max(0, fraction));
    const { lengthInMeters, travelTimeInSeconds } = route.properties.summary;
    return getCoordinateAtRouteProgress(
        route,
        axis === 'distance'
            ? { traveledDistanceInMeters: share * lengthInMeters }
            : { traveledTimeInSeconds: share * travelTimeInSeconds },
    );
};

const pointerFraction = (event: { clientX: number; currentTarget: Element }) => {
    const box = event.currentTarget.getBoundingClientRect();
    return { fraction: (event.clientX - box.left) / box.width, pixel: 1 / box.width };
};

type LaneTracksProps = LaneProps & {
    cursorStore: RouteCursorStore;
    /** A click on the tracks off any section: the route point under it, and points either side. */
    onPickPoint: (point: RouteCoordinateAtProgress, reach: RouteCoordinateAtProgress[]) => void;
    children: ReactNode;
};

/**
 * The lanes' common track area: the pointer on it moves the shared cursor along the route, and a
 * click off the sections picks the point under it.
 */
const LaneTracks = ({ route, axis, cursorStore, onPickPoint, children }: LaneTracksProps) => {
    const pickPoint = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target instanceof Element && event.target.closest('.ui-lane-block')) return;

        const { fraction, pixel } = pointerFraction(event);
        const point = progressAt(route, axis, fraction);
        const reach = [-1, 1].flatMap(
            (side) => progressAt(route, axis, fraction + side * POINT_REACH_PX * pixel) ?? [],
        );
        if (point) onPickPoint(point, reach);
    };

    const moveCursor = (event: PointerEvent<HTMLDivElement>) => {
        const progress = progressAt(route, axis, pointerFraction(event).fraction);
        if (progress) {
            cursorStore.set({
                routeIndex: route.properties.index,
                distanceInMeters: progress.distanceInMeters,
                from: 'bar',
            });
        }
    };

    return (
        <div
            className="ui-lane-tracks"
            onClick={pickPoint}
            onPointerMove={moveCursor}
            onPointerLeave={() => {
                if (cursorStore.get()?.from === 'bar') cursorStore.set(undefined);
            }}
        >
            {children}
            <Cursor route={route} axis={axis} cursorStore={cursorStore} />
            <AxisTicks route={route} axis={axis} />
        </div>
    );
};

/** The stops on a line; on the time axis, each stay stretches from arrival to departure. */
const StopsLane = ({ route, axis, stops }: LaneProps & { stops: Stop[] }) => {
    const marks = useMemo(() => stopMarks(route), [route]);
    const filled = filledStops(stops);
    return (
        <div className="ui-lane-track ui-lane-stops">
            {marks.map(({ arrive, leave }, index) => {
                const start = axisFraction(route, axis, arrive);
                const end = axisFraction(route, axis, leave);
                const stay = leave.travelTimeInSeconds - arrive.travelTimeInSeconds;
                const stop = filled[index];
                const row = stop?.index ?? index;
                const isEnd = row === 0 || row === stops.length - 1;
                const name = stop ? placeTitle(stop.place) : '';
                return (
                    <Fragment key={stop?.id ?? index}>
                        {end > start && (
                            <span
                                className="ui-lane-stay"
                                style={{ left: percent(start), width: percent(end - start) }}
                            >
                                {duration(stay)} stay
                            </span>
                        )}
                        <span
                            className={`ui-stop-badge ui-lane-stop${isEnd ? ' is-end' : ''}`}
                            style={{ left: percent(start) }}
                            title={`${name}${stay ? `, ${duration(stay)} stay` : ''}`}
                        >
                            {stopBadge(row, stops.length)}
                        </span>
                    </Fragment>
                );
            })}
        </div>
    );
};

type SectionLaneProps = LaneProps & {
    lane: Lane;
    activeId?: string;
    selectedId?: string;
    onHover: (sectionId?: string) => void;
    onPick: (block: LaneBlock) => void;
};

const SectionLane = ({ lane, route, axis, activeId, selectedId, onHover, onPick }: SectionLaneProps) => (
    <div className="ui-lane-track">
        {lane.blocks.map((block) => {
            const start = axisFraction(route, axis, block.start);
            const end = axisFraction(route, axis, block.end);
            return (
                <button
                    key={block.id}
                    type="button"
                    className={`ui-lane-block ui-lane-${lane.id}${block.tone ? ` ${block.tone}` : ''}${activeId === block.id ? ' is-active' : ''}${selectedId === block.id ? ' is-selected' : ''}`}
                    style={{ left: percent(start), width: percent(end - start) }}
                    aria-label={`${block.label}, from ${clockTime(addSeconds(route.properties.summary.departureTime, block.start.travelTimeInSeconds))}. Zoom to it and show its details`}
                    aria-pressed={selectedId === block.id}
                    onPointerEnter={() => onHover(block.id)}
                    onPointerLeave={() => onHover(undefined)}
                    onFocus={() => onHover(block.id)}
                    onBlur={() => onHover(undefined)}
                    onClick={() => onPick(block)}
                >
                    {lane.id === 'country' && block.label}
                </button>
            );
        })}
    </div>
);

const AxisTicks = ({ route, axis }: LaneProps) => {
    const { lengthInMeters, travelTimeInSeconds, departureTime } = route.properties.summary;
    return (
        <div className="ui-lane-axis" aria-hidden="true">
            {TICKS.map((tick) => (
                <span key={tick} style={{ left: percent(tick) }}>
                    {axis === 'distance'
                        ? distance(tick * lengthInMeters)
                        : clockTime(addSeconds(departureTime, tick * travelTimeInSeconds))}
                </span>
            ))}
        </div>
    );
};

/** Where the shared cursor is on this route, when it is on this route. */
const useCursorProgress = (route: Route, cursorStore: RouteCursorStore) => {
    const cursor = useRouteCursor(cursorStore);
    return cursor?.routeIndex === route.properties.index
        ? getCoordinateAtRouteProgress(route, { traveledDistanceInMeters: cursor.distanceInMeters })
        : undefined;
};

const Cursor = ({ route, axis, cursorStore }: LaneProps & { cursorStore: RouteCursorStore }) => {
    const progress = useCursorProgress(route, cursorStore);
    if (!progress) return null;

    return <span className="ui-lane-cursor" style={{ left: percent(axisFraction(route, axis, progress)) }} />;
};

type ReadoutProps = { route: Route; block?: LaneBlock; cursorStore: RouteCursorStore };

/** What the pointer is on: a section, else a point of the route, else the whole trip. */
const Readout = ({ route, block, cursorStore }: ReadoutProps) => {
    const progress = useCursorProgress(route, cursorStore);
    const { departureTime, lengthInMeters, travelTimeInSeconds } = route.properties.summary;
    const at = (seconds: number) => clockTime(addSeconds(departureTime, seconds));

    const text = block
        ? `${block.label} · ${at(block.start.travelTimeInSeconds)}–${at(block.end.travelTimeInSeconds)} · ${duration(block.end.travelTimeInSeconds - block.start.travelTimeInSeconds)}, ${distance(block.end.distanceInMeters - block.start.distanceInMeters)}`
        : progress
          ? `${at(progress.travelTimeInSeconds)} · ${progressInto(progress)}`
          : `${duration(travelTimeInSeconds)} · ${distance(lengthInMeters)}`;
    return <span className="ui-sections-readout">{text}</span>;
};
