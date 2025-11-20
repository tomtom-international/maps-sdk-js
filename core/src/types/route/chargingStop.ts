import type { ChargingSpeed, CommonPlaceProps, CurrentType, Place } from '..';

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

    /**
     * The charging speed classification of this charging connection.
     *
     * @remarks
     * - `slow`: Typically up to 12 kW (Level 1 AC charging)
     * - `regular`: Typically between 12 kW and 50 kW (Level 2 AC charging)
     * - `fast`: Typically between 50 kW and 150 kW (DC fast charging)
     * - `ultra-fast`: Typically above 150 kW (High-power DC fast charging)
     */
    chargingSpeed?: ChargingSpeed;
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
 * Properties specific to charging stops in electric vehicle routes.
 *
 * These properties are combined with {@link CommonPlaceProps} to form
 * a complete {@link ChargingStop} object.
 *
 * @group Route
 */
export type ChargingStopProps = CommonPlaceProps & {
    /**
     * Unique identifier for the charging park.
     */
    chargingParkId: string;
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
     * The best charging speed classification of this charging park amongst its connectors.
     *
     * @remarks
     * - `slow`: Typically up to 12 kW (Level 1 AC charging)
     * - `regular`: Typically between 12 kW and 50 kW (Level 2 AC charging)
     * - `fast`: Typically between 50 kW and 150 kW (DC fast charging)
     * - `ultra-fast`: Typically above 150 kW (High-power DC fast charging)
     */
    chargingParkSpeed?: ChargingSpeed;

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
    targetChargeInPCT?: number;
};

/**
 * Information about a battery charging stop along an electric vehicle route.
 *
 * A GeoJSON Feature representing a charging location where an EV needs to stop
 * and recharge during a long-distance journey (LDEVR - Long Distance EV Routing).
 *
 * @remarks
 * **Structure:**
 * - Extends {@link Place} (GeoJSON Feature with Point geometry)
 * - Includes all {@link CommonPlaceProps} (type, address, poi, chargingPark, etc.)
 * - Adds charging-specific properties from {@link ChargingStopProps}
 *
 * **When Provided:**
 * - For EV routes where charging is needed to reach the destination
 * - At the end of route legs where battery charge is insufficient for the next leg
 * - Contains both required and optional charging stop details
 *
 * **Key Properties:**
 * - `id`: Unique string identifier for this feature, corresponds to charging park ID.
 * - `type`: Always 'Feature' (GeoJSON)
 * - `geometry`: Point geometry with charging park coordinates [longitude, latitude]
 * - `properties`: Combined common place properties and charging-specific details
 *   - Standard place info: `type`, `address`, `poi`, `chargingPark`
 *   - Charging details: `chargingParkId`, `chargingParkUuid`, `chargingConnections`
 *   - Route planning: `chargingTimeInSeconds`, `targetChargeInkWh`, `targetChargeInPCT`
 *   - Metadata: `chargingParkName`, `chargingParkOperatorName`, `chargingParkPowerInkW`
 *
 * @example
 * ```typescript
 * const chargingStop: ChargingStop = {
 *   id: 'charging-stop-1',
 *   type: 'Feature',
 *   geometry: {
 *     type: 'Point',
 *     coordinates: [4.8945, 52.3667]
 *   },
 *   properties: {
 *     // CommonPlaceProps
 *     type: 'POI',
 *     address: {
 *       freeformAddress: 'Amsterdam Central Station',
 *       municipality: 'Amsterdam',
 *       country: 'Netherlands'
 *     },
 *     // ChargingStopProps
 *     chargingParkId: 'park123',
 *     chargingParkUuid: 'uuid-123-456',
 *     chargingParkName: 'Amsterdam Central Station - North Side',
 *     chargingParkOperatorName: 'Ionity',
 *     chargingConnections: [{
 *       plugType: 'IEC_62196_Type_2_Connector_Cable_Attached',
 *       chargingPowerInkW: 150,
 *       currentType: 'DC'
 *     }],
 *     chargingTimeInSeconds: 1200,
 *     chargingParkPowerInkW: 150,
 *     chargingStopType: 'Auto_Generated',
 *     targetChargeInkWh: 75,
 *     targetChargeInPCT: 75
 *   }
 * };
 * ```
 *
 * @group Route
 */
export type ChargingStop = Place<ChargingStopProps>;
