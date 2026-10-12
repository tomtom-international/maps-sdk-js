import type { ConnectorType, Fuel, POICategory } from '@tomtom-org/maps-sdk/core';
import type { PlaceFilters, RefinementSuggestion } from '@tomtom-org/maps-sdk/services';
import {
    BedDouble,
    Coffee,
    Fuel as FuelIcon,
    PlugZap,
    SquareParking,
    Trees,
    Truck,
    UtensilsCrossed,
} from 'lucide-react';
import { keysOf } from '../keysOf';
import type { ChipLook } from '../panel/fields';

/** What to search for: free text, a category or a brand, with the filters that narrow it. */
export type SearchRequest = { title: string; query?: string; filters?: PlaceFilters };

/** Around the map's view, or within a detour of the selected route. */
export type SearchScope = 'map' | 'route';

/** The charging and fuel options, sent only with a search for charging or fuel stations. */
export type StationFilters = Pick<PlaceFilters, 'connectors' | 'minPowerKW' | 'maxPowerKW' | 'fuelTypes'>;

export const categoryChips: (ChipLook & { categories: POICategory[] })[] = [
    { label: 'EV charging', icon: PlugZap, categories: ['CHARGING_LOCATION'] },
    { label: 'Fuel', icon: FuelIcon, categories: ['FUEL_STATION'] },
    { label: 'Parking', icon: SquareParking, categories: ['PARKING_GARAGE', 'OPEN_CAR_PARKING_AREA'] },
    { label: 'Rest areas', icon: Trees, categories: ['REST_AREA'] },
    { label: 'Truck stops', icon: Truck, categories: ['TRUCK_STOP'] },
    { label: 'Coffee', icon: Coffee, categories: ['COFFEE_SHOP', 'CAFE_PUB'] },
    { label: 'Restaurants', icon: UtensilsCrossed, categories: ['RESTAURANT', 'FAST_FOOD'] },
    { label: 'Hotels', icon: BedDouble, categories: ['HOTEL_OR_MOTEL'] },
];

export const connectorLabels = {
    IEC62196Type2CCS: 'CCS (Combo 2)',
    IEC62196Type2Outlet: 'Type 2 socket',
    IEC62196Type2CableAttached: 'Type 2 cable',
    Chademo: 'CHAdeMO',
    Tesla: 'Tesla',
    IEC62196Type1CCS: 'CCS (Combo 1)',
} satisfies Partial<Record<ConnectorType, string>>;

export const connectorOptions = keysOf(connectorLabels);

export const powerStepsKW = [11, 22, 50, 100, 150, 350];

export const fuelLabels: Record<Fuel, string> = {
    Petrol: 'Petrol',
    Diesel: 'Diesel',
    DieselForCommercialVehicles: 'Truck diesel',
    Biodiesel: 'Biodiesel',
    LPG: 'LPG',
    CNG: 'CNG',
    LNG: 'LNG',
    E85: 'E85',
    Hydrogen: 'Hydrogen',
    AdBlue: 'AdBlue',
};

export const fuels = keysOf(fuelLabels);

export const searchesFor = (request: SearchRequest | undefined, category: POICategory): boolean =>
    request?.filters?.poiCategories?.includes(category) ?? false;

export const categoryRequest = (title: string, categories: POICategory[]): SearchRequest => ({
    title,
    filters: { poiCategories: categories },
});

/**
 * A brand or category suggestion as a request of its own, so it runs in either scope. Along-route
 * search takes no `countries`, so only the narrowing from its `refineParams` is kept.
 */
export const refinementRequest = (suggestion: RefinementSuggestion): SearchRequest =>
    suggestion.kind === 'category'
        ? categoryRequest(suggestion.title, [suggestion.category])
        : { title: suggestion.title, filters: { poiBrands: suggestion.refineParams.filters?.poiBrands } };

/** The request's filters, plus the station options that apply to what it searches for. */
export const requestFilters = (
    request: SearchRequest,
    { connectors, minPowerKW, maxPowerKW, fuelTypes }: StationFilters,
): PlaceFilters | undefined => {
    const charging = searchesFor(request, 'CHARGING_LOCATION');
    const fuel = searchesFor(request, 'FUEL_STATION');
    const filters: PlaceFilters = {
        ...request.filters,
        ...(charging && connectors?.length && { connectors }),
        ...(charging && minPowerKW && { minPowerKW }),
        ...(charging && maxPowerKW && { maxPowerKW }),
        ...(fuel && fuelTypes?.length && { fuelTypes }),
    };
    return Object.keys(filters).length ? filters : undefined;
};
