/**
 * Fuel types available at gas stations and refueling points.
 *
 * Identifies the types of fuel offered at a location. Use this to find
 * stations with specific fuel types or filter search results.
 *
 * @remarks
 * Common fuel types:
 * - `Petrol` / `Diesel`: Traditional fossil fuels
 * - `E85`: 85% ethanol blend
 * - `LPG`: Liquefied petroleum gas (propane)
 * - `CNG`: Compressed natural gas
 * - `LNG`: Liquefied natural gas
 * - `Hydrogen`: Fuel cell hydrogen
 * - `Biodiesel`: Renewable diesel
 * - `AdBlue`: Diesel exhaust fluid (DEF)
 *
 * @example
 * ```typescript
 * // Station with multiple fuel types
 * const fuels: Fuel[] = ['Petrol', 'Diesel', 'LPG'];
 *
 * // Hydrogen fuel cell station
 * const fuels: Fuel[] = ['Hydrogen'];
 * ```
 *
 * @group Place
 * @category Types
 */
export type Fuel =
    | 'Petrol'
    | 'LPG'
    | 'Diesel'
    | 'Biodiesel'
    | 'DieselForCommercialVehicles'
    | 'E85'
    | 'LNG'
    | 'CNG'
    | 'Hydrogen'
    | 'AdBlue';
