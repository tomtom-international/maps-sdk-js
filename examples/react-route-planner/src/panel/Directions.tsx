import { getInstructionLanes, type Instruction, type Maneuver, type Route } from '@tomtom-org/maps-sdk/core';
import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import {
    ArrowUp,
    ArrowUpLeft,
    ArrowUpRight,
    CornerUpLeft,
    CornerUpRight,
    Flag,
    type LucideIcon,
    MapPin,
    Navigation,
    RotateCw,
    Undo2,
} from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { addSeconds, clockTime, distance } from '../format';
import { flyBetweenPanels } from '../map/coveringPanels';
import { roadIcons } from './icons';
import { laneSign } from './laneSign';
import './Directions.css';

type DirectionsProps = {
    map: TomTomMap;
    route: Route;
    /** How far the trip replay is into the route, undefined before it starts. */
    elapsedSeconds?: number;
    onJump: (secondsIn: number) => void;
};

// The message is optional: fall back to the maneuver code, `TURN_LEFT` reading as "Turn left".
const instructionText = ({ message, maneuver }: Instruction): string =>
    message ?? `${maneuver.charAt(0)}${maneuver.slice(1).toLowerCase().replaceAll('_', ' ')}`;

/** The first match wins, so the specific maneuvers come before the left and right catch-alls. */
const maneuverIcons: [RegExp, LucideIcon][] = [
    [/^DEPART/, Navigation],
    [/^ARRIVE/, Flag],
    [/^WAYPOINT/, MapPin],
    [/UTURN|ROUNDABOUT_BACK/, Undo2],
    [/ROUNDABOUT/, RotateCw],
    [/FERRY/, roadIcons.ferry],
    [/CAR_TRAIN/, roadIcons.carTrain],
    [/BORDER/, roadIcons.country],
    [/TOLL/, roadIcons.toll],
    [/^(TURN|SHARP)_LEFT/, CornerUpLeft],
    [/^(TURN|SHARP)_RIGHT/, CornerUpRight],
    [/LEFT/, ArrowUpLeft],
    [/RIGHT/, ArrowUpRight],
];

const maneuverIcon = (maneuver: Maneuver): LucideIcon =>
    maneuverIcons.find(([pattern]) => pattern.test(maneuver))?.[1] ?? ArrowUp;

const secondsInto = (instruction: Instruction) => instruction.routePath[0]?.travelTimeInSeconds ?? 0;

/** The lanes into a maneuver, drawn in the row's text colour. */
const laneSignOf = (route: Route, instruction: Instruction): string | undefined => {
    const lanes = getInstructionLanes(route, instruction);
    return lanes && laneSign(lanes);
};

/** What each row shows that depends on the route alone, worked out once per route rather than at every replay step. */
const rowsOf = (route: Route) => {
    const instructions = route.properties.guidance?.instructions ?? [];
    const { departureTime } = route.properties.summary;
    return instructions.map((instruction, index) => {
        const previous = instructions[index - 1];
        const secondsIn = secondsInto(instruction);
        return {
            instruction,
            secondsIn,
            fromPrevious: previous && instruction.routeOffsetInMeters - previous.routeOffsetInMeters,
            ManeuverIcon: maneuverIcon(instruction.maneuver),
            sign: laneSignOf(route, instruction),
            clock: clockTime(addSeconds(departureTime, secondsIn)),
        };
    });
};

/** Keeps the instruction the replay is on in view, without scrolling the rest of the page. */
const useScrollIntoView = (index: number) => {
    const list = useRef<HTMLOListElement>(null);
    useEffect(() => {
        if (index >= 0) list.current?.children[index]?.scrollIntoView({ block: 'nearest' });
    }, [index]);
    return list;
};

/**
 * Turn by turn, with the clock time at each maneuver, following the trip replay: driven ones fade
 * and the current one stands out. Click one to see it on the map and move the replay there.
 */
export const Directions = ({ map, route, elapsedSeconds, onJump }: DirectionsProps) => {
    const rows = useMemo(() => rowsOf(route), [route]);
    const current =
        elapsedSeconds === undefined ? -1 : rows.findLastIndex(({ secondsIn }) => secondsIn <= elapsedSeconds);
    const list = useScrollIntoView(current);
    if (!rows.length) return <p className="ui-note">No directions for this route.</p>;

    return (
        <ol className="ui-directions" ref={list}>
            {rows.map(({ instruction, secondsIn, fromPrevious, ManeuverIcon, sign, clock }, index) => {
                const state = index === current ? ' is-current' : index < current ? ' is-passed' : '';
                return (
                    <li key={`${instruction.pathPointIndex}-${instruction.maneuver}`}>
                        <button
                            type="button"
                            className={`ui-direction${state}`}
                            aria-current={index === current ? 'step' : undefined}
                            onClick={() => {
                                flyBetweenPanels(map, instruction.maneuverPoint, 16);
                                onJump(secondsIn);
                            }}
                        >
                            <span className="ui-direction-icon">
                                <ManeuverIcon />
                            </span>
                            <span className="ui-direction-body">
                                <span className="ui-direction-text">{instructionText(instruction)}</span>
                                {sign && (
                                    <span className="ui-direction-lanes" dangerouslySetInnerHTML={{ __html: sign }} />
                                )}
                                <span className="ui-direction-meta">
                                    {clock}
                                    {fromPrevious ? ` · after ${distance(fromPrevious)}` : ''}
                                </span>
                            </span>
                        </button>
                    </li>
                );
            })}
        </ol>
    );
};
