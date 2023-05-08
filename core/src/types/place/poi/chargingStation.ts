import { Connector } from "./connector";

/**
 * @group Place
 * @category Variables
 */
export const accessibility = [
    "Unspecified",
    "NoRestriction",
    "GenericRestriction",
    "ResidentsOnly",
    "EmployeesOnly",
    "AuthorizedPersonnelOnly",
    "MembersOnly"
] as const;

/**
 * @group Place
 * @category Types
 */
export type Accessibility = (typeof accessibility)[number];

/**
 * @group Place
 * @category Variables
 */
export const chargingPointStatus = ["Available", "Reserved", "Occupied", "OutOfService", "Unknown"] as const;

/**
 * @group Place
 * @category Types
 */
export type ChargingPointStatus = (typeof chargingPointStatus)[number];

/**
 * @group Place
 * @category Types
 */
export type ChargingPoint = {
    /**
     * Charging point ID.
     */
    evseId: string;

    /**
     * Status of charging point, indicating whether it is available or not:
     */
    status: ChargingPointStatus;

    /**
     * Array of connector objects
     */
    connectors: Connector[];
};

/**
 * @group Place
 * @category Types
 */
export type ChargingStation = {
    /**
     * Charging station ID.
     */
    chargingStationId: string;

    /**
     * Defines the accessibility of a charging infrastructure element (e.g. station):
     * Unspecified - no information on the possible restrictions on using it.
     * NoRestriction - charging station is available to all and no specific restrictions apply.
     * GenericRestriction - some restriction applies, but the nature of the restriction is not known.
     * ResidentsOnly - only residents of the area/building the EV POI belongs to can use it.
     * EmployeesOnly - only employees of the company/companies the EV POI belongs to can use it.
     * AuthorizedPersonnelOnly - charging station is located on network that is accessible for authorized personnel or authorized vehicles only (e.g. inside a military base)
     * MembersOnly - charging station is located on network that is accessible for members and guests only (e.g inside private country clubs or golf clubs)
     */
    accessibility: Accessibility;

    /**
     * Array of chargingPoint objects
     */
    chargingPoints: ChargingPoint[];
};
