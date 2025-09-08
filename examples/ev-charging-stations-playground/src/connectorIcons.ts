import { ConnectorType } from '@cet/maps-sdk-js/core';
import chademoIcon from './resources/ic-chademo-24.svg?raw';
import domesticIcon from './resources/ic-domestic-euro-24.svg?raw';
import industrialBlue from './resources/ic-industrial-blue-24.svg?raw';
import industrialRed from './resources/ic-industrial-red-24.svg?raw';
import teslaIcon from './resources/ic-tesla-usa-24.svg?raw';
import type1CCSIcon from './resources/ic-type-1-combo-24.svg?raw';
import yasakiIcon from './resources/ic-type-1-yasaki-24.svg?raw';
import mennekesIcon from './resources/ic-type-2-mennekes-24.svg?raw';
import type3Icon from './resources/ic-type-3-24.svg?raw';
import type3aIcon from './resources/ic-type-3a-24.svg?raw';

export const connectorIcons: Partial<Record<ConnectorType, string>> = {
    Tesla: teslaIcon,
    StandardHouseholdCountrySpecific: domesticIcon,
    IEC62196Type1: yasakiIcon,
    IEC62196Type1CCS: type1CCSIcon,
    IEC62196Type2CCS: type3aIcon,
    IEC62196Type2Outlet: mennekesIcon,
    IEC62196Type2CableAttached: mennekesIcon,
    Chademo: chademoIcon,
    IEC62196Type3: type3Icon,
    IEC60309AC1PhaseBlue: industrialBlue,
    IEC60309AC3PhaseRed: industrialRed,
};
