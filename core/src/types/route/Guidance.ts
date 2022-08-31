import { Position } from "geojson";

/**
 * Type of the junction at which the maneuver takes place, i.e. regular junction, roundabout or bifurcation.
 */
export type JunctionType = "REGULAR" | "ROUNDABOUT" | "BIFURCATION";

/**
 * Indicates left-hand vs. right-hand side driving at the point of the maneuver.
 */
export type DrivingSide = "LEFT" | "RIGHT";

/**
 * Description of the maneuver, for example: arrive or turn right.
 * @see https://developer.tomtom.com/routing-api/documentation/routing/calculate-route#maneuver-codes
 */
export type Maneuver =
    | "ARRIVE"
    | "ARRIVE_LEFT"
    | "ARRIVE_RIGHT"
    | "DEPART"
    | "STRAIGHT"
    | "KEEP_RIGHT"
    | "BEAR_RIGHT"
    | "TURN_RIGHT"
    | "SHARP_RIGHT"
    | "KEEP_LEFT"
    | "BEAR_LEFT"
    | "TURN_LEFT"
    | "SHARP_LEFT"
    | "MAKE_UTURN"
    | "TRY_MAKE_UTURN"
    | "ROUNDABOUT_CROSS"
    | "ROUNDABOUT_RIGHT"
    | "ROUNDABOUT_LEFT"
    | "ROUNDABOUT_BACK"
    | "FOLLOW"
    | "ENTER_MOTORWAY"
    | "ENTER_FREEWAY"
    | "ENTER_HIGHWAY"
    | "TAKE_FERRY"
    | "WAYPOINT_LEFT"
    | "WAYPOINT_RIGHT"
    | "WAYPOINT_REACHED"
    | "TAKE_EXIT"
    | "MOTORWAY_EXIT_LEFT"
    | "MOTORWAY_EXIT_RIGHT"
    | "SWITCH_PARALLEL_ROAD"
    | "SWITCH_MAIN_ROAD"
    | "ENTRANCE_RAMP";

/**
 * Type of the instruction, e.g., turn or change of road form.
 */
export type InstructionType =
    | "TURN"
    | "ROAD_CHANGE"
    | "LOCATION_DEPARTURE"
    | "LOCATION_ARRIVAL"
    | "DIRECTION_INFO"
    | "LOCATION_WAYPOINT";

/**
 * A set of attributes describing a maneuver, e.g., "Turn right", "Keep left", "Take the ferry", "Take the motorway", "Arrive".
 */
export type Instruction = {
    /**
     * The distance from the start of the route to the point of the instruction.
     */
    routeOffsetInMeters: number;
    /**
     * The estimated travel time up to the point corresponding to routeOffsetInMeters.
     */
    travelTimeInSeconds: number;
    /**
     * Location of the maneuver.
     */
    point: Position;
    /**
     * The index of the point in the array of polyline points.
     *
     * Equivalent to startPointIndex and endPointIndex in sections:
     * * Largest index in the polyline of the route for which points[pointIndex] lies on or before point.
     * * In particular, you may assume that point lies on points[pointIndex] or on the route segment described by
     * points[pointIndex] and points[pointIndex+1].
     */
    pointIndex: number;
    /**
     * The type of instruction, e.g., a turn or a change of road form.
     */
    instructionType?: InstructionType;
    /**
     * This lists the road number of the next significant road segment after the maneuver, or of the road that has to be followed.
     * * Example: ["E34","N205"]
     */
    roadNumbers?: string[];
    /**
     * A string telling the number(s) of a highway exit taken by the current maneuver.
     *
     * If an exit has multiple exit numbers, numbers will be separated by "," and possibly aggregated by "-", e.g., "10, 13-15".
     */
    exitNumber?: string;
    /**
     * The street name of the next significant road segment after the maneuver, or of the street that should be followed.
     */
    street?: string;
    /**
     * The text on a signpost which is most relevant to the maneuver, or to the direction that should be followed.
     */
    signpostText?: string;
    /**
     * The 3-character {@link https://gist.github.com/tadast/8827699 ISO 3166-1 alpha-3} country code.
     */
    countryCode?: string;
    /**
     * A subdivision (e.g., state) of the country, represented by the second part of an
     * {@link https://www.iso.org/standard/63546.html ISO 3166-2 code}.
     * * This is only available for some countries like the US, Canada, and Mexico.
     */
    stateCode?: string;
    /**
     * The type of the junction where the maneuver takes place.
     *
     * For larger roundabouts, two separate instructions are generated for entering and leaving the roundabout.
     */
    junctionType?: JunctionType;
    /**
     * Indicates the direction of an instruction. If junctionType indicates a turn instruction:
     * * -180 = U-turn
     * * [-179, -1] = Left turn
     * * 0 = Straight on (a '0 degree' turn)
     * * [1, 179] = Right turn
     *
     * If junctionType indicates a bifurcation instruction:
     * * <0 - keep left
     * * \>0 - keep right
     */
    turnAngleInDecimalDegrees?: number;
    /**
     * This indicates which exit to take at a roundabout.
     */
    roundaboutExitNumber?: number;
    /**
     * It is possible to optionally combine the instruction with the next one.
     * * This can be used to build messages like "Turn left and then turn right".
     */
    possibleCombineWithNext?: boolean;
    /**
     * Indicates left-hand vs. right-hand side driving at the point of the maneuver.
     */
    drivingSide?: DrivingSide;
    /**
     * A code identifying the maneuver (e.g., "Turn right").
     */
    maneuver?: Maneuver;
    /**
     * A human-readable (and possibly {@link https://developer.tomtom.com/routing-api/documentation/routing/calculate-route#tagged-messages formatted})
     * message for the maneuver.
     * *
     */
    message?: string;
    /**
     * A human-readable message for the maneuver combined with the message from the next instruction.
     * @see {@link https://developer.tomtom.com/routing-api/documentation/routing/calculate-route#example-of-a-combined-message Example of a combined message}
     */
    combinedMessage?: string;
};

/**
 * This groups a sequence of instruction elements which are related to each other.
 * * The sequence range is constrained with firstInstructionIndex and lastInstructionIndex.
 * * When human-readable text messages are requested for guidance (instructionType=text or tagged),
 * then the instructionGroup has a summary message returned when available.*
 */
export type InstructionGroup = {
    /**
     * Index of the first instruction in the instructions list.
     */
    firstInstructionIndex: number;
    /**
     * Index of the last instruction in the instructions list.
     */
    lastInstructionIndex: number;
    /**
     * Overall travelled length of the group in meters.
     */
    groupLengthInMeters?: number;

    /**
     * When human-readable text messages are requested for guidance (instructionType=text or tagged),
     * then the instructionGroup has a summary message returned when available.
     */
    groupMessage?: string;
};

/**
 * Contains guidance related elements. This field is present only when guidance was requested and is available.
 */
export type Guidance = {
    /**
     * Main ordered list of instructions to follow.
     */
    instructions: Instruction[];
    /**
     * This groups a sequence of instruction elements which are related to each other.
     * * They refer to the main instructions list.
     */
    instructionGroups: InstructionGroup[];
};
