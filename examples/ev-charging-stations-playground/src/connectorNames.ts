import { ConnectorType } from '@tomtom-org/maps-sdk-js/core';

export const connectorNames: Record<ConnectorType, string> = {
    StandardHouseholdCountrySpecific: 'Domestic plug',
    Tesla: 'Tesla',
    IEC62196Type1: 'Type 1',
    IEC62196Type1CCS: 'Type 1 CCS',
    IEC62196Type2CableAttached: 'Type 2 cable',
    IEC62196Type2Outlet: 'Type 2 no cable',
    IEC62196Type2CCS: 'CCS',
    IEC62196Type3: 'Type 3',
    Chademo: 'CHAdeMO',
    GBT20234Part2: 'GBT Part 2',
    GBT20234Part3: 'GBT Part 3',
    IEC60309AC1PhaseBlue: 'Industrial Blue',
    IEC60309AC3PhaseRed: 'Industrial Red',
    IEC60309DCWhite: 'Industrial White',
};
