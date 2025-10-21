import type { Position } from 'geojson';
import type { CurrentType } from '..';

/**
 * Available plug types for EV charging.
 * @group Route
 */
export const plugTypes = [
    'Small_Paddle_Inductive',
    'Large_Paddle_Inductive',
    'IEC_60309_1_Phase',
    'IEC_60309_3_Phase',
    'IEC_62196_Type_1_Outlet',
    'IEC_62196_Type_2_Outlet',
    'IEC_62196_Type_3_Outlet',
    'IEC_62196_Type_1_Connector_Cable_Attached',
    'IEC_62196_Type_2_Connector_Cable_Attached',
    'IEC_62196_Type_3_Connector_Cable_Attached',
    'Combo_to_IEC_62196_Type_1_Base',
    'Combo_to_IEC_62196_Type_2_Base',
    'Type_E_French_Standard_CEE_7_5',
    'Type_F_Schuko_CEE_7_4',
    'Type_G_British_Standard_BS_1363',
    'Type_J_Swiss_Standard_SEV_1011',
    'China_GB_Part_2',
    'China_GB_Part_3',
    'IEC_309_DC_Plug',
    'AVCON_Connector',
    'Tesla_Connector',
    'NEMA_5_20',
    'CHAdeMO',
    'SAE_J1772',
    'TEPCO',
    'Better_Place_Socket',
    'Marechal_Socket',
    'Standard_Household_Country_Specific',
] as const;

/**
 * Standard plug/connector type for electric vehicle charging.
 *
 * Defines the physical connector type used for charging, which must match
 * the vehicle's charging port. Different regions and manufacturers use different standards.
 *
 * @remarks
 * Common standards include:
 * - **IEC 62196 Types**: European and international standards (Type 1, Type 2, Type 3)
 * - **CHAdeMO**: Japanese DC fast charging standard
 * - **CCS (Combo)**: Combined charging system (AC + DC)
 * - **Tesla_Connector**: Tesla proprietary connector
 * - **SAE_J1772**: North American standard for AC charging
 * - **China_GB**: Chinese national standard
 * - **NEMA**: North American standard household outlets
 *
 * Different vehicles support different plug types, and charging stations may have multiple
 * connector types available.
 *
 * @example
 * ```typescript
 * // Common connector types
 * const type2: PlugType = 'IEC_62196_Type_2_Connector_Cable_Attached';  // Common in Europe
 * const chademo: PlugType = 'CHAdeMO';  // Japanese standard
 * const ccs: PlugType = 'Combo_to_IEC_62196_Type_2_Base';  // CCS Combo 2
 * const tesla: PlugType = 'Tesla_Connector';  // Tesla vehicles
 * ```
 *
 * @group Route
 */
export type PlugType = (typeof plugTypes)[number];

/**
 * Information about a specific charging connection at a charging point.
 *
 * Describes the technical specifications of a charging connector including
 * plug type, voltage, current, and power ratings.
 *
 * @group Route
 */
export type ChargingConnectionInfo = {
    /**
     * The plug type for this charging connection.
     *
     * Must be compatible with the vehicle's charging port.
     */
    plugType: PlugType;
    /**
     * The rated voltage in volts (V) of the charging process.
     *
     * Common values: 120V, 240V (AC), 400V, 800V (DC)
     */
    voltageInV?: number;
    /**
     * The rated current in amperes (A) of the charging process.
     *
     * Determines the charging speed along with voltage.
     */
    currentInA?: number;
    /**
     * The current type (AC/DC) for this charging connection.
     *
     * - AC: Alternating current (slower charging, 1-phase or 3-phase)
     * - DC: Direct current (fast charging)
     */
    currentType?: CurrentType;
    /**
     * The rated maximum power in kilowatts (kW) of the charging connection.
     *
     * Indicates the maximum charging speed. Common values:
     * - 3-7 kW: Level 1/2 AC charging
     * - 7-22 kW: Level 2 AC charging
     * - 50-350 kW: DC fast charging
     */
    chargingPowerInkW?: number;
};

/**
 * Geographic location information for a charging park.
 *
 * @group Route
 */
export type ChargingParkLocation = {
    /**
     * Geographic coordinates of the charging park [longitude, latitude].
     */
    coordinates: Position;

    // TODO: to be moved into common Place props
    /**
     * Street name where the charging park is located.
     */
    street?: string;
    /**
     * House/building number of the charging park.
     */
    houseNumber?: string;
    /**
     * City name where the charging park is located.
     */
    city?: string;
    /**
     * Region, state, or province where the charging park is located.
     */
    region?: string;
    /**
     * Postal/ZIP code of the charging park location.
     */
    postalCode?: string;
    /**
     * Country where the charging park is located.
     */
    country?: string;
};

/**
 * Available payment methods for electric vehicle charging stations.
 *
 * Defines the types of payment accepted at charging locations.
 *
 * @remarks
 * - `No_Payment`: Free charging, no payment required
 * - `Subscription`: Requires a subscription or membership plan
 * - `Direct`: Pay-per-use, direct payment (credit card, app, etc.)
 *
 * @group Route
 */
export const paymentMethods = ['No_Payment', 'Subscription', 'Direct'] as const;

/**
 * Payment method type for electric vehicle charging stations.
 *
 * Specifies how users can pay for charging services at a particular station.
 *
 * @example
 * ```typescript
 * const method: PaymentMethod = 'Subscription';
 * ```
 *
 * @group Route
 */
export type PaymentMethod = (typeof paymentMethods)[number];

/**
 * Payment option configuration for a charging station.
 *
 * Describes a specific payment method and associated payment brands/networks
 * accepted at a charging location.
 *
 * @remarks
 * The `brands` array may include specific payment network names or provider brands
 * that are accepted when using the specified payment method.
 *
 * @example
 * ```typescript
 * // Credit card payment with specific brands
 * const paymentOption: ChargingPaymentOption = {
 *   method: 'Direct',
 *   brands: ['Visa', 'Mastercard', 'American Express']
 * };
 *
 * // Subscription-based payment
 * const subscriptionOption: ChargingPaymentOption = {
 *   method: 'Subscription',
 *   brands: ['ChargePoint', 'EVgo']
 * };
 * ```
 *
 * @group Route
 */
export type ChargingPaymentOption = {
    /**
     * The payment method type accepted at this charging station.
     */
    method: PaymentMethod;
    /**
     * Optional list of specific payment brands or networks accepted.
     *
     * Examples: credit card brands (Visa, Mastercard), charging networks
     * (ChargePoint, EVgo), or payment apps (Apple Pay, Google Pay).
     */
    brands?: string[];
};

/**
 * Information about a battery charging stop along an electric vehicle route.
 *
 * Provided for routes with electric vehicle parameters when charging stops are
 * necessary to complete the journey (Long Distance EV Routing / LDEVR).
 *
 * @remarks
 * **When Provided:**
 * - For EV routes where charging is needed to reach the destination
 * - At the end of route legs where battery charge is insufficient for the next leg
 * - Contains both required and optional charging stop details
 *
 * **Key Information:**
 * - Location and identification of the charging park
 * - Available charging connections and their specifications
 * - Estimated charging time needed
 * - Target charge levels for continuing the journey
 * - Payment options and operator information
 *
 * @example
 * ```typescript
 * const chargingStop: BatteryCharging = {
 *   chargingParkId: 'park123',
 *   chargingParkUuid: 'uuid-123-456',
 *   location: {
 *     coordinates: [4.8945, 52.3667],
 *     city: 'Amsterdam',
 *     country: 'Netherlands'
 *   },
 *   chargingConnections: [{
 *     plugType: 'IEC_62196_Type_2_Connector_Cable_Attached',
 *     chargingPowerInkW: 150,
 *     currentType: 'DC'
 *   }],
 *   chargingTimeInSeconds: 1200,
 *   chargingParkPowerInkW: 150,
 *   chargingStopType: 'Auto_Generated',
 *   targetChargeInkWh: 75,
 *   targetChargeInPCT: 75
 * };
 * ```
 *
 * @group Route
 */
export type BatteryCharging = {
    /**
     * Unique identifier for the charging park.
     */
    chargingParkId: string;
    /**
     * Geographic location and address of the charging park.
     */
    location: ChargingParkLocation;
    /**
     * Array of available charging connections at this park.
     *
     * Each connection specifies plug type, power ratings, and current type.
     */
    chargingConnections: ChargingConnectionInfo[];
    /**
     * Estimated time in seconds required to charge the battery at this stop.
     *
     * Calculated based on:
     * - Current battery charge level
     * - Target charge level for next leg
     * - Charging power of the selected connector
     * - Battery charging curve characteristics
     */
    chargingTimeInSeconds: number;

    /**
     * The unique UUID identifier of this charging park.
     *
     * This universally unique identifier can be used to:
     * - Check real-time availability of charging stations
     * - Query detailed charging park information
     * - Track charging park status and updates
     * - Cross-reference with TomTom EV Charging Stations API
     *
     * @remarks
     * Use this UUID with the EV Charging Stations Availability API to get
     * real-time connector availability before arriving at the charging stop.
     *
     * @example
     * ```typescript
     * // Use UUID to check availability
     * const availability = await evChargingAvailability.get({
     *   chargingAvailability: chargingStop.chargingParkUuid
     * });
     * ```
     */
    chargingParkUuid: string;

    /**
     * Detailed information about the recommended charging connection for this stop.
     *
     * Specifies which connector type, power level, and charging specifications
     * should be used at this charging park for optimal charging.
     *
     * @remarks
     * This is typically the best connector available that matches:
     * - Vehicle's charging capabilities
     * - Required charging speed for the journey
     * - Availability at the charging park
     */
    chargingConnectionInfo?: ChargingConnectionInfo;

    /**
     * Detailed geographic location information for this charging park.
     *
     * Provides coordinates and address details to help locate the charging station.
     *
     * @remarks
     * This may provide more detailed location information than the base `location` property,
     * including street address, postal code, and regional details.
     */
    chargingParkLocation?: ChargingParkLocation;

    /**
     * The common name of this charging park.
     *
     * A human-readable name for the charging location, often including nearby
     * landmarks, business names, or descriptive identifiers.
     *
     * @example
     * ```typescript
     * chargingParkName: "Amsterdam Central Station - North Side"
     * chargingParkName: "Shell Recharge - Highway A2"
     * ```
     */
    chargingParkName?: string;

    /**
     * The charging network operator or provider name.
     *
     * Identifies the company or organization that operates this charging park.
     *
     * @remarks
     * Common operators include: Shell Recharge, Ionity, ChargePoint, EVgo,
     * Tesla Supercharger, Fastned, etc.
     *
     * @example
     * ```typescript
     * chargingParkOperatorName: "Ionity"
     * chargingParkOperatorName: "Shell Recharge"
     * ```
     */
    chargingParkOperatorName?: string;

    /**
     * Maximum available charging power at this charging park in kilowatts (kW).
     *
     * Represents the highest power output available across all charging connections
     * at this location. Actual charging power may be lower depending on:
     * - Vehicle capabilities
     * - Selected connector type
     * - Battery state of charge
     * - Grid conditions
     *
     * @remarks
     * This is typically the power of the fastest charger at the park.
     *
     * @example
     * ```typescript
     * // A charging park with multiple chargers
     * chargingParkPowerInkW: 150 // Has at least one 150kW charger
     * ```
     */
    chargingParkPowerInkW?: number;

    /**
     * The source of the charging stop at the end of this leg.
     *
     * Indicates whether the charging stop was automatically calculated by the
     * routing engine or explicitly specified by the user.
     *
     * @remarks
     * - `Auto_Generated`: The routing engine selected this charging stop to optimize the route
     * - `User_Defined`: The user explicitly requested a charging stop at this location
     */
    chargingStopType?: 'Auto_Generated' | 'User_Defined';

    /**
     * Available payment options at this charging park.
     *
     * Lists the payment methods accepted at this charging location.
     * Multiple options may be available.
     */
    chargingParkPaymentOptions?: ChargingPaymentOption[];

    /**
     * Target battery charge level in kilowatt-hours (kWh) after charging.
     *
     * The routing engine determines the optimal charge level to minimize
     * total journey time while ensuring the vehicle can reach the next stop.
     */
    targetChargeInkWh: number;
    /**
     * Target battery charge level as a percentage of maximum capacity.
     *
     * Derived from targetChargeInkWh and the vehicle's maximum battery capacity.
     *
     * @example
     * ```typescript
     * // If maxChargeInkWh is 100 and targetChargeInkWh is 80
     * targetChargeInPCT // 80
     * ```
     */
    targetChargeInPCT: number;
};
