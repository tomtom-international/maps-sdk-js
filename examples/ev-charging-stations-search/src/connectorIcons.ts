import { ConnectorType } from '@tomtom-org/maps-sdk/core';
import chademoIcon from './ic-chademo-24.svg?raw';
import domesticIcon from './ic-domestic-euro-24.svg?raw';
import industrialBlue from './ic-industrial-blue-24.svg?raw';
import industrialRed from './ic-industrial-red-24.svg?raw';
import teslaIcon from './ic-tesla-usa-24.svg?raw';
import type1CCSIcon from './ic-type-1-combo-24.svg?raw';
import yasakiIcon from './ic-type-1-yasaki-24.svg?raw';
import mennekesIcon from './ic-type-2-mennekes-24.svg?raw';
import type3Icon from './ic-type-3-24.svg?raw';
import type3aIcon from './ic-type-3a-24.svg?raw';

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
