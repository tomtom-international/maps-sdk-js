/**
 * @group Place
 * @category Variables
 */
export const connectorTypes = [
    'StandardHouseholdCountrySpecific',
    'IEC62196Type1',
    'IEC62196Type1CCS',
    'IEC62196Type2CableAttached',
    'IEC62196Type2Outlet',
    'IEC62196Type2CCS',
    'IEC62196Type3',
    'Chademo',
    'GBT20234Part2',
    'GBT20234Part3',
    'IEC60309AC3PhaseRed',
    'IEC60309AC1PhaseBlue',
    'IEC60309DCWhite',
    'Tesla',
] as const;

/**
 * Electric vehicle charging connector type.
 *
 * Defines the physical connector standard used for EV charging.
 * Different regions and vehicle manufacturers use different connector types.
 *
 * @remarks
 * Common connector types:
 * - `IEC62196Type1`: SAE J1772 (North America, Japan)
 * - `IEC62196Type2CableAttached`: Mennekes/Type 2 (Europe)
 * - `IEC62196Type1CCS`: CCS Type 1 (Combined Charging System)
 * - `IEC62196Type2CCS`: CCS Type 2 (Combined Charging System)
 * - `Chademo`: CHAdeMO (Japan, DC fast charging)
 * - `Tesla`: Tesla proprietary connector
 * - `GBT20234Part2/3`: Chinese GB/T standard
 *
 * @example
 * ```typescript
 * const connectorType: ConnectorType = 'IEC62196Type2CCS';
 * ```
 *
 * @group Place
 * @category Types
 */
export type ConnectorType = (typeof connectorTypes)[number];

/**
 * @group Place
 * @category Variables
 */
export const currentTypes = ['AC1', 'AC3', 'DC'] as const;

/**
 * Current type for electric vehicle charging.
 *
 * Specifies the type of electrical current used for charging.
 *
 * @remarks
 * - `AC1`: Alternating Current, single-phase (slower charging, typically 3-7 kW)
 * - `AC3`: Alternating Current, three-phase (faster AC charging, up to 22 kW)
 * - `DC`: Direct Current (DC fast charging, 50-350+ kW)
 *
 * @example
 * ```typescript
 * const currentType: CurrentType = 'DC';  // DC fast charging
 * ```
 *
 * @group Place
 * @category Types
 */
export type CurrentType = (typeof currentTypes)[number];

/**
 * Electric vehicle charging connector with specifications.
 *
 * Describes a specific charging connector available at a charging point,
 * including its technical specifications and capabilities.
 *
 * @example
 * ```typescript
 * const connector: Connector = {
 *   id: 'connector-1',
 *   type: 'IEC62196Type2CCS',
 *   ratedPowerKW: 150,
 *   voltageV: 400,
 *   currentA: 375,
 *   currentType: 'DC'
 * };
 * ```
 *
 * @group Place
 * @category Types
 */
export type Connector = {
    /**
     * Unique identifier for this connector.
     */
    id: string;
    /**
     * Physical connector type/standard.
     *
     * Must match the vehicle's charging port for compatibility.
     */
    type: ConnectorType;
    /**
     * Rated charging power in kilowatts (kW).
     *
     * Indicates the maximum charging speed. Common values:
     * - 3-7 kW: Level 1/2 AC charging
     * - 7-22 kW: Level 2 AC charging
     * - 50-150 kW: DC fast charging
     * - 150-350 kW: DC ultra-fast charging
     */
    ratedPowerKW: number;
    /**
     * Voltage in volts (V).
     *
     * Operating voltage for this connector.
     * Common values: 120V, 240V (AC), 400V, 800V (DC)
     */
    voltageV: number;
    /**
     * Current in amperes (A).
     *
     * Maximum current capacity for this connector.
     */
    currentA: number;
    /**
     * Type of electrical current (AC or DC).
     */
    currentType: CurrentType;
};
