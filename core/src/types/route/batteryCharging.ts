import type { CurrentType } from '..';
import type { Position } from 'geojson';

/**
 * Available plug types for EV charging.
 * @group Route
 * @category Variables
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
 * Plug type for EV charging.
 * @group Route
 * @category Types
 */
export type PlugType = (typeof plugTypes)[number];

/**
 * @group Route
 * @category Types
 */
export type ChargingConnectionInfo = {
    /**
     * The plug type for this charging connection.
     */
    plugType: PlugType;
    /**
     * The rated voltage in volts of the charging process.
     */
    voltageInV?: number;
    /**
     * The rated current in amperes of the charging process.
     */
    currentInA?: number;
    /**
     * The current type (AC/DC) for this charging connection.
     */
    currentType?: CurrentType;
    /**
     * The rated maximal power in kilowatts of the charging connection.
     */
    chargingPowerInkW?: number;
};

/**
 * @group Route
 * @category Types
 */
export type ChargingParkLocation = {
    /**
     * The position of the charging park.
     */
    coordinates: Position;

    // TODO: to be moved into common Place props
    /**
     * The street name of the charging park.
     */
    street?: string;
    /**
     * The house number of the charging park.
     */
    houseNumber?: string;
    /**
     * The city of the charging park.
     */
    city?: string;
    /**
     * The region of the charging park.
     */
    region?: string;
    /**
     * The postal code of the charging park.
     */
    postalCode?: string;
    /**
     * The country code of the charging park in the ISO 3166-1 alpha-2 format.
     */
    countryCode: string;
};

/**
 * Available payment methods for a charging station.
 * @group Route
 * @category Variables
 */
export const paymentMethods = ['No_Payment', 'Subscription', 'Direct'] as const;

/**
 * Payment method for a charging station.
 * @group Route
 * @category Types
 */
export type PaymentMethod = (typeof paymentMethods)[number];

/**
 * @group Route
 * @category Types
 */
export type ChargingPaymentOption = {
    method: PaymentMethod;
    brands?: string[];
};

/**
 * @group Route
 * @category Types
 */
export type BatteryCharging = {
    /**
     * The charge in kWH to which the battery should be charged.
     */
    targetChargeInkWh: number;

    /**
     * The charge in % to which the battery should be charged.
     */
    targetChargePCT: number;

    /**
     * The estimated time in seconds spent at the charging stop,
     * allowing for some additional time needed to use the charging facility.
     */
    chargingTimeInSeconds: number;

    /**
     * The unique identifier of this charging park.
     * * This uuid can be used to check the availability of the charging park.
     */
    chargingParkUuid: string;

    /**
     * Describes details of the charging connection which should be used at this charging stop.
     */
    chargingConnectionInfo?: ChargingConnectionInfo;

    /**
     * Describes location details of this charging park.
     */
    chargingParkLocation?: ChargingParkLocation;

    /**
     * The common name of this charging park.
     */
    chargingParkName?: string;

    /**
     * The common operator name of this charging park.
     */
    chargingParkOperatorName?: string;

    /**
     * The rated power in kilowatts of the charging park.
     */
    chargingParkPowerInkW?: number;

    /**
     * The source of the charging stop at the end of this leg.
     */
    chargingStopType?: 'Auto_Generated' | 'User_Defined';

    /**
     * Payment options for the charging stop.
     */
    chargingParkPaymentOptions?: ChargingPaymentOption[];
};
