/**
 * @group Place
 * @category Variables
 */
export const connectorTypes = [
    "StandardHouseholdCountrySpecific",
    "IEC62196Type1",
    "IEC62196Type1CCS",
    "IEC62196Type2CableAttached",
    "IEC62196Type2Outlet",
    "IEC62196Type2CCS",
    "IEC62196Type3",
    "Chademo",
    "GBT20234Part2",
    "GBT20234Part3",
    "IEC60309AC3PhaseRed",
    "IEC60309AC1PhaseBlue",
    "IEC60309DCWhite",
    "Tesla"
] as const;

/**
 * @group Place
 * @category Types
 */
export type ConnectorType = (typeof connectorTypes)[number];

/**
 * @group Place
 * @category Variables
 */
export const currentTypes = ["AC1", "AC3", "DC"] as const;

/**
 * Current types.
 * * AC1: Alternating_Current_1_Phase
 * * AC3: Alternating_Current_3_Phase
 * * DC: Direct_Current
 * @group Place
 * @category Types
 */
export type CurrentType = (typeof currentTypes)[number];

/**
 * @group Place
 * @category Types
 */
export type Connector = {
    type: ConnectorType;
    ratedPowerKW: number;
    currentA: number;
    currentType: CurrentType;
    voltageV: number;
};
