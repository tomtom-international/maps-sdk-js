import type { Position } from "geojson";

/**
 * Indicates left-hand vs. right-hand side driving at the point of the maneuver.
 * @group Route
 * @category Types
 */
export type DrivingSide = "LEFT" | "RIGHT";

/**
 * The properties of road.
 * URBAN -> represents an urban road type.
 * MOTORWAY -> represents a motorway road type.
 * CONTROLLED_ACCESS -> represents a controlled access road type with regulated traffic flow and regulated entries and exits.
 * @group Route
 * @category Types
 */
export type RoadInformationProperty = "URBAN" | "MOTORWAY" | "CONTROLLED_ACCESS";

/**
 * Type of landmarks that can be used in instructions.
 * @group Route
 * @category Types
 */
export type Landmark =
    | "END_OF_ROAD"
    | "AT_TRAFFIC_LIGHT"
    | "ON_TO_BRIDGE"
    | "ON_BRIDGE"
    | "AFTER_BRIDGE"
    | "INTO_TUNNEL"
    | "INSIDE_TUNNEL"
    | "AFTER_TUNNEL";

/**
 * Description of the maneuver, for example: arrive or turn right.
 * @see https://developer.tomtom.com/routing-api/documentation/routing/calculate-route#maneuver-codes
 * @group Route
 * @category Types
 */
export type Maneuver =
    | "DEPART"
    | "WAYPOINT_LEFT"
    | "WAYPOINT_RIGHT"
    | "WAYPOINT_REACHED"
    | "WAYPOINT_AHEAD"
    | "ARRIVE"
    | "ARRIVE_LEFT"
    | "ARRIVE_RIGHT"
    | "ARRIVE_AHEAD"
    | "STRAIGHT"
    | "KEEP_LEFT"
    | "KEEP_RIGHT"
    | "SLIGHT_RIGHT"
    | "TURN_RIGHT"
    | "SHARP_RIGHT"
    | "SLIGHT_LEFT"
    | "TURN_LEFT"
    | "SHARP_LEFT"
    | "MAKE_UTURN"
    | "ROUNDABOUT_STRAIGHT"
    | "ROUNDABOUT_SHARP_RIGHT"
    | "ROUNDABOUT_RIGHT"
    | "ROUNDABOUT_SLIGHT_RIGHT"
    | "ROUNDABOUT_SLIGHT_LEFT"
    | "ROUNDABOUT_LEFT"
    | "ROUNDABOUT_SHARP_LEFT"
    | "ROUNDABOUT_BACK"
    | "EXIT_ROUNDABOUT"
    | "EXIT_MOTORWAY_LEFT"
    | "EXIT_MOTORWAY_RIGHT"
    | "SWITCH_MOTORWAY_LEFT"
    | "SWITCH_MOTORWAY_RIGHT"
    | "ENTER_CARPOOL_LANE_LEFT"
    | "ENTER_CARPOOL_LANE_RIGHT"
    | "EXIT_CARPOOL_LANE_LEFT"
    | "EXIT_CARPOOL_LANE_RIGHT"
    | "MERGE_LEFT_LANE"
    | "MERGE_RIGHT_LANE"
    | "TAKE_SHIP_FERRY"
    | "TAKE_CAR_TRAIN"
    | "LEAVE_SHIP_FERRY"
    | "LEAVE_CAR_TRAIN"
    | "CROSS_BORDER"
    | "TOLLGATE";

/**
 * Side from where the road connects to the route.
 * @group Route
 * @category Types
 */
export type SideRoadSide = "LEFT" | "RIGHT" | "LEFT_AND_RIGHT";

/**
 * Available toll payment options.
 * @group Route
 * @category Types
 */
export type TollPaymentType =
    | "CASH_COINS_AND_BILLS"
    | "CASH_BILLS_ONLY"
    | "CASH_COINS_ONLY"
    | "CASH_EXACT_CHANGE"
    | "CREDIT_CARD"
    | "DEBIT_CARD"
    | "TRAVEL_CARD"
    | "ETC"
    | "ETC_TRANSPONDER"
    | "ETC_VIDEO_CAMERA"
    | "SUBSCRIPTION";

/**
 * Route path point and its metadata.
 * @group Route
 * @category Types
 */
export type RoutePathPoint = {
    point: Position;
    /**
     * Distance (in meters) from the start of the route to this point.
     */
    distanceInMeters: number;
    /**
     * The time (in seconds) from the start of the route to this point.
     */
    travelTimeInSeconds: number;
};

/**
 * Text with phonetic transcription.
 * @group Route
 * @category Types
 */
export type TextWithPhonetics = {
    /**
     * The name as a text string.
     */
    text: string;
    /**
     * The phonetic transcription of the name.
     * Included if phonetic transcription is available for the specific name, and phonetic transcriptions have been requested by the client.
     * Note: The phonetic transcription can contain double quote characters ("). In this case those characters are escaped with a backslash (\).
     */
    phonetic: string;
    /**
     * Encodes the language using an IETF language tag, e.g., en-GB, en-US.
     */
    phoneticLanguageCode: string;
};

/**
 * Object describes a single road shield reference.
 * @group Route
 * @category Types
 */
export type RoadShieldReference = {
    /**
     * A unique identifier for the road shield.
     */
    reference: string;
    /**
     * An optional string to be shown on the road shield.
     */
    shieldContent?: string;
    /**
     * An optional list of possible affixes that can be shown in addition to the shieldContent.
     */
    affixes: string[];
};

/**
 * Road shield object containing extra information.
 * @group Route
 * @category Types
 */
export type RoadShield = {
    /**
     * The road number. Most road numbers have a 'letter' prefix, which is also returned.
     */
    roadNumber: TextWithPhonetics;
    /**
     * Information allowing the client to build an image of the road shield using the TomTom RoadShield API.
     * Included if instructionRoadShieldReferences was requested.
     */
    roadShieldReference: RoadShieldReference;
    /**
     * The state code of the state the shield is in (second part of an ISO 3166-2 identifier).
     * Included if state codes are available for the country the road shield is located in.
     */
    stateCode?: string;
    /**
     * The country code (ISO 3166-1 alpha-3) of the country the shield is in.
     */
    countryCode: string;
};

/**
 * Road information, including properties, street name and road shields.
 * @group Route
 * @category Types
 */
export type RoadInformation = {
    /**
     * The properties of road, as a possible combination of several values.
     */
    properties: RoadInformationProperty[];
    /**
     * The street name for the road.
     * Included if street name is available for this road.
     */
    streetName?: TextWithPhonetics;
    /**
     * Lists the road shields for this road.
     * The list can be empty if no road shields are available.
     */
    roadShields: RoadShield[];
};

/**
 * Signpost information.
 * @group Route
 * @category Types
 */
export type Signpost = {
    /**
     * Exit name of the controlled access road.
     * Included if an exit name is available for this signpost.
     */
    exitName?: TextWithPhonetics;
    /**
     * Exit number of the controlled access road. Included if an exit number is available for this signpost.
     * Multiple exit numbers can be encoded in the string, e.g. "E10/E12". If exit number is not available, the field will be absent.
     */
    exitNumber?: TextWithPhonetics;
    /**
     * The toward name from the signpost.
     */
    towardName: TextWithPhonetics;
};

/**
 * Side road information.
 * @group Route
 * @category Types
 */
export type SideRoad = {
    /**
     * Side from where the road connects to the route.
     */
    side: SideRoadSide;
    /**
     * Offset (on route) of the side road from the maneuver point (represented by maneuverPoint), in meters.
     * The offset is absolute, i.e., it is a positive integer despite that the side road is located before the maneuver on the route.
     */
    offsetFromManeuverInMeters: number;
};

/**
 * A set of attributes describing a maneuver, e.g., "Turn right", "Keep left", "Take the ferry", "Take the motorway", "Arrive".
 * @group Route
 * @category Types
 */
export type Instruction = {
    /**
     * The index of the point on the route path where the maneuver takes place.
     * * maneuverPoint is expected to be equal to the path point at this index.
     */
    pathPointIndex: number;
    /**
     * Location of the maneuver.
     */
    maneuverPoint: Position;
    /**
     * The distance from the start of the route to the point of the instruction.
     */
    routeOffsetInMeters: number;
    /**
     * A code identifying the maneuver (e.g., "Turn right").
     */
    maneuver: Maneuver;
    /**
     * A maneuver can occupy more than one point. For such a maneuver, this field will contain a sequence of all the points it occupies on the map.
     * For maneuvers that only occupy a single point, this field will contain a single array item, with a point value equal to maneuverPoint.
     */
    routePath: RoutePathPoint[];
    /**
     * Provides information about the road in the link before the maneuver.
     */
    previousRoadInfo: RoadInformation;
    /**
     * Provides information about the road we are heading to (past the maneuver).
     * The source of this information is either the road past the maneuver or the signpost at the maneuver if such exists.
     */
    nextRoadInfo: RoadInformation;
    /**
     * Included if a signpost is available for this maneuver.
     * Provides the information displayed in the signpost indicating the direction on route.
     */
    signpost?: Signpost;
    /**
     * Name of the intersection at which the maneuver must be performed.
     * Included if intersection name is available for this maneuver.
     */
    intersectionName?: TextWithPhonetics;
    /**
     * Indicates left-hand vs. right-hand side driving at the point of the maneuver.
     */
    drivingSide?: DrivingSide;
    /**
     * Included if instruction has a landmark.
     */
    landmark?: Landmark;
    /**
     * Included if the landmark is AT_TRAFFIC_LIGHT, and a maneuver takes place at the second traffic light (out of two consequent traffic lights).
     * In such case this attribute represents the distance on the route (in meters) between those traffic lights.
     */
    trafficLightOffsetInMeters?: number;
    /**
     * List of roads connected to the route but not part of it, right before the maneuver.
     * These are roads which the driver can accidentally take based on the instruction without considering the dynamic restriction of the route like time or vehicle profile dependent restriction.
     * Dual-carriageway roads might be represented as a single or several side roads, depending on how the driver might perceive them.
     * The list will be empty if no road is crossing the route before the maneuver.
     * This information can be used to allow a richer graphical presentation of the maneuver and visualize connected roads preceding it in proximity.
     * The list is ordered in ascending order of offset on route.
     * Included if there are side roads within a reasonable distance before the maneuver.
     */
    sideRoads?: SideRoad[];
    /**
     * The base URL of the Road Shields service to fetch the road shield atlas and metadata resources.
     * Currently available resources are:
     * sprite.png
     * sprite.json
     * We recommend to cache the sprite atlas (sprite.png) and metadata (sprite.json) as it changes infrequently and is large compared to a typical road shield description.
     */
    roadShieldAtlasReference?: string;
    /**
     * List of road shield references to be shown for the instruction.
     */
    roadShieldReferences?: RoadShieldReference[];
    /**
     * List of road shield references to be shown for the signpost.
     */
    signpostRoadShieldReferences?: RoadShieldReference[];
    /**
     * Marks this maneuver as obligatory. For example, when a driver reaches a T-junction, where one option is drivable, while the other is not.
     * Included if the maneuver is a turn maneuver, i.e., maneuver is one of the following:
     * SLIGHT_RIGHT
     * TURN_RIGHT
     * SHARP_RIGHT
     * SLIGHT_LEFT
     * TURN_LEFT
     * SHARP_LEFT
     * MAKE_UTURN
     */
    isManeuverObligatory?: boolean;
    /**
     * Gives the total change of angle (in degrees) from the entry until the exit of the maneuver, in the range [-180,180). For example, -90 means "forks off to the left in a perpendicular angle".
     * At complex junctions, the angle is relative to the entry road.
     * Included if the maneuver is a turn or roundabout maneuver, i.e., maneuver is one of the following:
     * STRAIGHT
     * SLIGHT_RIGHT
     * TURN_RIGHT
     * SHARP_RIGHT
     * SLIGHT_LEFT
     * TURN_LEFT
     * SHARP_LEFT
     * MAKE_UTURN
     * ROUNDABOUT_STRAIGHT
     * ROUNDABOUT_SLIGHT_RIGHT
     * ROUNDABOUT_RIGHT
     * ROUNDABOUT_SHARP_RIGHT
     * ROUNDABOUT_SLIGHT_LEFT
     * ROUNDABOUT_LEFT
     * ROUNDABOUT_SHARP_LEFT
     * ROUNDABOUT_BACK
     */
    changeOfAngleInDegrees?: number;
    /**
     * Included if current maneuver is an exit, and there is another exit before the current maneuver within reasonable distance, which may cause ambiguity.
     * In such case there might be a need to resolve the ambiguity on client side, and compose an instruction like "Take the 2nd exit".
     * Represents the offset (on route) of the ambiguous exit from the maneuver point (represented by maneuverPoint), in meters.
     * The offset is absolute, i.e., it is a positive integer despite the ambiguous exit being located before the maneuver on the route.
     * Applicable for maneuvers where maneuver is one of the following values:
     * EXIT_ROUNDABOUT
     * EXIT_MOTORWAY_LEFT
     * EXIT_MOTORWAY_RIGHT
     * SWITCH_MOTORWAY_LEFT
     * SWITCH_MOTORWAY_RIGHT
     */
    offsetOfAmbiguousExitFromManeuverInMeters?: number;
    /**
     * The ordinal number of the exit to take at a roundabout, e.g., "take the first/second exit".
     * Included if the maneuver is a roundabout maneuver, i.e., maneuver is one of the following:
     * ROUNDABOUT_STRAIGHT
     * ROUNDABOUT_SLIGHT_RIGHT
     * ROUNDABOUT_RIGHT
     * ROUNDABOUT_SHARP_RIGHT
     * ROUNDABOUT_SLIGHT_LEFT
     * ROUNDABOUT_LEFT
     * ROUNDABOUT_SHARP_LEFT
     * ROUNDABOUT_BACK
     */
    roundaboutExitNumber?: number;
    /**
     * The name of the tollgate, if available.
     * Included if the maneuver is a tollgate maneuver, i.e., maneuver is TOLLGATE.
     */
    tollgateName?: TextWithPhonetics;
    /**
     * Included if the maneuver is a tollgate maneuver, i.e., maneuver is TOLLGATE.
     * Array containing one or more available toll payment options for this tollgate.
     */
    tollPaymentTypes?: TollPaymentType[];
    /**
     * The name of the country the border crossing occurs from.
     * Included if the maneuver is a border crossing maneuver, or leads to a border crossing, i.e., maneuver is one of:
     * CROSS_BORDER
     * TAKE_SHIP_FERRY
     * TAKE_CAR_TRAIN
     * LEAVE_SHIP_FERRY
     * LEAVE_CAR_TRAIN
     */
    countryCrossingFromName?: TextWithPhonetics;
    /**
     * The code (ISO 3166-1 alpha-3) of the country the border crossing occurs from.
     * Included if the maneuver is a border crossing maneuver, i.e., maneuver is one of:
     * CROSS_BORDER
     * TAKE_SHIP_FERRY
     * TAKE_CAR_TRAIN
     * LEAVE_SHIP_FERRY
     * LEAVE_CAR_TRAIN
     */
    countryCrossingFromCode?: string;
    /**
     * The name of the country the border crossing occurs to.
     * Included if the maneuver is a border crossing maneuver, or leads to a border crossing, i.e., maneuver is one of:
     * CROSS_BORDER
     * TAKE_SHIP_FERRY
     * TAKE_CAR_TRAIN
     * LEAVE_SHIP_FERRY
     * LEAVE_CAR_TRAIN
     */
    countryCrossingToName?: TextWithPhonetics;
    /**
     * The code (ISO 3166-1 alpha-3) of the country the border crossing occurs to.
     * Included if the maneuver is a border crossing maneuver, i.e., maneuver is one of:
     * CROSS_BORDER
     * TAKE_SHIP_FERRY
     * TAKE_CAR_TRAIN
     * LEAVE_SHIP_FERRY
     * LEAVE_CAR_TRAIN
     */
    countryCrossingToCode?: string;
};

/**
 * Contains guidance related elements. This field is present only when guidance was requested and is available.
 * @group Route
 * @category Types
 */
export type Guidance = {
    /**
     * Main ordered list of instructions to follow.
     */
    instructions: Instruction[];
};
