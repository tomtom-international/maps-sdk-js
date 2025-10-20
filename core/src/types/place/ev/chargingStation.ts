import type { Connector } from './connector';

/**
 * @group Place
 * @category Variables
 */
export const chargingStationAccessTypes = ['Public', 'Authorized', 'Restricted', 'Private', 'Unknown'] as const;

/**
 * Access type for EV charging stations.
 *
 * Indicates who can use the charging station.
 *
 * @remarks
 * - `Public`: Open to all electric vehicle drivers
 * - `Authorized`: Requires membership, subscription, or authorization
 * - `Restricted`: Limited access (e.g., hotel guests, employees only)
 * - `Private`: Private use only, not available to public
 * - `Unknown`: Access type not specified
 *
 * @example
 * ```typescript
 * const accessType: ChargingStationsAccessType = 'Public';
 * ```
 *
 * @group Place
 * @category Types
 */
export type ChargingStationsAccessType = (typeof chargingStationAccessTypes)[number];

/**
 * @group Place
 * @category Variables
 */
export const chargingPointStatus = ['Available', 'Reserved', 'Occupied', 'OutOfService', 'Unknown'] as const;

/**
 * Real-time operational status of a charging point.
 *
 * @remarks
 * - `Available`: Ready for use, not currently occupied
 * - `Reserved`: Reserved by another user
 * - `Occupied`: Currently in use
 * - `OutOfService`: Not operational (maintenance or malfunction)
 * - `Unknown`: Status information unavailable
 *
 * @example
 * ```typescript
 * const status: ChargingPointStatus = 'Available';
 * ```
 *
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
    'ChargingProfileCapable',
    'ChargingPreferencesCapable',
    'ChipCardSupport',
    'ContactlessCardSupport',
    'CreditCardPayable',
    'DebitCardPayable',
    'PedTerminal',
    'RemoteStartStopCapable',
    'Reservable',
    'RfidReader',
    'StartSessionConnectorRequired',
    'TokenGroupCapable',
    'UnlockCapable',
    'PlugAndCharge',
    'Unknown',
] as const;

/**
 * Capability of a charging point.
 *
 * Describes features and payment options available at the charging point.
 *
 * @remarks
 * - `ChargingProfileCapable`: Supports custom charging profiles
 * - `ChargingPreferencesCapable`: Supports charging preferences
 * - `ChipCardSupport`: Payment terminal accepts chip cards
 * - `ContactlessCardSupport`: Payment terminal accepts contactless cards
 * - `CreditCardPayable`: Accepts credit card payments
 * - `DebitCardPayable`: Accepts debit card payments
 * - `PedTerminal`: Has PIN entry device for payments
 * - `RemoteStartStopCapable`: Can be started/stopped remotely
 * - `Reservable`: Supports reservations
 * - `RfidReader`: Supports RFID token authorization
 * - `StartSessionConnectorRequired`: Requires connector ID to start session
 * - `TokenGroupCapable`: Supports token groups for start/stop with different tokens
 * - `UnlockCapable`: Connector can be remotely unlocked
 * - `PlugAndCharge`: Supports ISO 15118 Plug & Charge (automatic authentication)
 * - `Unknown`: Capability not specified
 *
 * @example
 * ```typescript
 * // Check for specific capabilities
 * const capabilities: ChargingPointCapability[] = [
 *   'CreditCardPayable',
 *   'Reservable',
 *   'RemoteStartStopCapable'
 * ];
 * ```
 *
 * @group Place
 * @category Types
 */
export type ChargingPointCapability = (typeof chargingPointCapabilities)[number];

/**
 * @group Place
 * @category Variables
 */
export const chargingPointRestrictions = ['EvOnly', 'Plugged', 'Disabled', 'Customers', 'Motorcycles'] as const;

/**
 * Parking or usage restrictions for a charging point.
 *
 * Indicates special requirements or limitations for using the charging location.
 *
 * @remarks
 * - `EvOnly`: Reserved parking spot for electric vehicles only
 * - `Plugged`: Parking allowed only while actively charging
 * - `Disabled`: Reserved for disabled persons with valid identification
 * - `Customers`: For customers/guests only (e.g., hotel, shop)
 * - `Motorcycles`: Suitable only for electric motorcycles or scooters
 *
 * @example
 * ```typescript
 * const restrictions: ChargingPointRestriction[] = ['EvOnly', 'Customers'];
 * ```
 *
 * @group Place
 * @category Types
 */
export type ChargingPointRestriction = (typeof chargingPointRestrictions)[number];

/**
 * Individual charging point (EVSE - Electric Vehicle Supply Equipment).
 *
 * Represents a single charging unit with one or more connectors.
 *
 * @remarks
 * A charging station typically contains multiple charging points.
 * Each charging point can have multiple connectors of different types.
 *
 * @example
 * ```typescript
 * const chargingPoint: ChargingPoint = {
 *   evseId: 'EVSE-001',
 *   status: 'Available',
 *   capabilities: ['CreditCardPayable', 'RemoteStartStopCapable', 'PlugAndCharge'],
 *   restrictions: ['EvOnly'],
 *   connectors: [
 *     { id: 'conn-1', type: 'IEC62196Type2CCS', ratedPowerKW: 150, ... }
 *   ]
 * };
 * ```
 *
 * @group Place
 * @category Types
 */
export type ChargingPoint = {
    /**
     * Unique identifier for this charging point (EVSE ID).
     *
     * Often follows international standards like ISO 15118.
     */
    evseId: string;

    /**
     * Capabilities and features of this charging point.
     *
     * Indicates payment options, remote control, and advanced features.
     */
    capabilities: ChargingPointCapability[];

    /**
     * Usage or parking restrictions for this charging point.
     *
     * Specifies who can use the charger or special parking rules.
     */
    restrictions: ChargingPointRestriction[];

    /**
     * Real-time operational status of this charging point.
     *
     * Indicates if the charger is available, occupied, or out of service.
     */
    status: ChargingPointStatus;

    /**
     * Physical connectors available at this charging point.
     *
     * Each connector represents a different plug type and charging capability.
     */
    connectors?: Connector[];
};

/**
 * Electric vehicle charging station.
 *
 * Represents a complete charging station facility with one or more charging points.
 * A station is typically at a single location but may have multiple charging units.
 *
 * @example
 * ```typescript
 * const station: ChargingStation = {
 *   id: 'station-123',
 *   chargingPoints: [
 *     { evseId: 'EVSE-001', status: 'Available', ... },
 *     { evseId: 'EVSE-002', status: 'Occupied', ... }
 *   ]
 * };
 * ```
 *
 * @group Place
 * @category Types
 */
export type ChargingStation = {
    /**
     * Unique identifier for the charging station.
     */
    id: string;

    /**
     * Array of charging points available at this station.
     *
     * Each charging point can serve one vehicle at a time.
     */
    chargingPoints: ChargingPoint[];
};
