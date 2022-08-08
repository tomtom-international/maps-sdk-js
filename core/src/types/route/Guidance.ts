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
 * Represents a set of attributes describing a maneuver, e.g. 'Turn right', 'Keep left', 'Take the ferry', 'Take the
 * motorway', 'Arrive'.
 *
 * IMPORTANT: this is a TT API JSON-mapped object. Double-check usages/exposure before changing inside.
 */
export type Instruction = {
    routeOffsetInMeters?: number;
    travelTimeInSeconds?: number;
    point?: [number, number];
    pointIndex?: number;
    instructionType?: InstructionType;
    roadNumbers?: string[];
    exitNumber?: string;
    street?: string;
    signpostText?: string;
    countryCode?: string;
    stateCode?: string;
    junctionType?: JunctionType;
    /**
     * Turn angle in decimal degrees.
     */
    turnAngleInDecimalDegrees?: number;
    roundaboutExitNumber?: number;
    possibleCombineWithNext?: boolean;
    drivingSide?: DrivingSide;
    maneuver?: Maneuver;
    message?: string;
    combinedMessage?: string;
};

/**
 * Groups a sequence of instruction elements which are related to each other.
 * The sequence range is constrained with firstInstructionIndex and lastInstructionIndex.
 * When human-readable text messages are requested for guidance (instructionType=text or tagged),
 * then the instructionGroup has a summary message returned when available.
 */
export type InstructionGroup = {
    firstInstructionIndex?: number;
    lastInstructionIndex?: number;
    groupLengthInMeters?: number;
    groupMessage?: string;
};

/**
 * Contains guidance related elements. This field is present only when guidance was requested and is available.
 * Actually contains guidance instructions and instruction groups.
 */
export type Guidance = {
    instructions?: Instruction[];
    instructionGroups?: InstructionGroup[];
};
