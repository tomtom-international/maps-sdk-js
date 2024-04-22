import type { Connector } from "./connector";

/**
 * @group Place
 * @category Variables
 */
export const chargingStationAccessTypes = ["Public", "Authorized", "Restricted", "Private", "Unknown"] as const;

/**
 * Access type of the charging station.
 * @group Place
 * @category Types
 */
export type ChargingStationsAccessType = (typeof chargingStationAccessTypes)[number];

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
 * Possible capabilities for a charging point.
 * @group Place
 * @category Variables
 */
export const chargingPointCapabilities = [
    "ChargingProfileCapable",
    "ChargingPreferencesCapable",
    "ChipCardSupport",
    "ContactlessCardSupport",
    "CreditCardPayable",
    "DebitCardPayable",
    "PedTerminal",
    "RemoteStartStopCapable",
    "Reservable",
    "RfidReader",
    "StartSessionConnectorRequired",
    "TokenGroupCapable",
    "UnlockCapable",
    "PlugAndCharge",
    "Unknown"
] as const;

/**
 * Capability of a charging point:
 * * ChargingProfileCapable - The EVSE supports charging profiles.
 * * ChargingPreferencesCapable - The EVSE supports charging preferences.
 * * ChipCardSupport - EVSE has a payment terminal that supports chip cards.
 * * ContactlessCardSupport - EVSE has a payment terminal that supports contactless cards.
 * * CreditCardPayable - EVSE has a payment terminal that makes it possible to pay for charging using a credit card.
 * * DebitCardPayable - EVSE has a payment terminal that makes it possible to pay for charging using a debit card.
 * * PedTerminal - EVSE has a payment terminal with a pin-code entry device.
 * * RemoteStartStopCapable - The EVSE can remotely be started/stopped.
 * * Reservable - The EVSE can be reserved.
 * * RfidReader - Charging at this EVSE can be authorized with an RFID token.
 * * StartSessionConnectorRequired - When a StartSession is sent to this EVSE, the MSP is required to add the optional connector_id field in the StartSession object.
 * * TokenGroupCapable - This EVSE supports token groups, two or more tokens work as one, so that a session can be started with one token and stopped with another (handy when a card and key-fob are given to the EV-driver).
 * * UnlockCapable - Connectors have mechanical lock that can be requested by the eMSP to be unlocked.
 * * PlugAndCharge
 * * Unknown
 * @group Place
 * @category Types
 */
export type ChargingPointCapability = (typeof chargingPointCapabilities)[number];

/**
 * @group Place
 * @category Variables
 */
export const chargingPointRestrictions = ["EvOnly", "Plugged", "Disabled", "Customers", "Motorcycles"] as const;

/**
 * Restriction of the charging point:
 *
 * * EvOnly - Reserved parking spot for electric vehicles.
 * * Plugged - Parking is only allowed while plugged in (charging).
 * * Disabled - Reserved parking spot for disabled people with valid ID.
 * * Customers - Parking spot for customers/guests only, for example in case of a hotel or shop.
 * * Motorcycles - Parking spot only suitable for (electric) motorcycles or scooters.
 * @group Place
 * @category Types
 */
export type ChargingPointRestriction = (typeof chargingPointRestrictions)[number];

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
     * Capabilities of the charging point.
     */
    capabilities: ChargingPointCapability[];

    /**
     * Restrictions of the charging station.
     */
    restrictions: ChargingPointRestriction[];

    /**
     * Dynamic availability status of the charging point.
     */
    status: ChargingPointStatus;

    /**
     * Connectors available at the charging point.
     */
    connectors: Connector[];
};

/**
 * @group Place
 * @category Types
 */
export type ChargingStation = {
    /**
     * Charging station identifier.
     */
    id: string;

    /**
     * Charging points available at the station.
     */
    chargingPoints: ChargingPoint[];
};
