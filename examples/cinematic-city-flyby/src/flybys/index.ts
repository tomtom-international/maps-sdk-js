import { cityFlybys } from './cities';
import { landscapeFlybys } from './landscapes';
import type { Flyby } from './types';

export type { FlightLeg, Flyby, LandmarkTurn, StreetRun } from './types';
export { speedFactorOf } from './types';

export const flybys: Flyby[] = [...cityFlybys, ...landscapeFlybys];
