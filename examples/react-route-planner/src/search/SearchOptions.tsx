import { MapIcon, Route } from 'lucide-react';
import { ChipButton, ChipChecklist, ChipChoice, type ChipLook, Select } from '../panel/fields';
import {
    categoryChips,
    categoryRequest,
    connectorLabels,
    connectorOptions,
    fuelLabels,
    fuels,
    powerStepsKW,
    type SearchScope,
    searchesFor,
} from './searchRequest';
import type { PlaceSearch } from './usePlaceSearch';
import './SearchOptions.css';

const detourMinuteOptions = [5, 10, 15, 30, 60];

const scopeLooks: Record<SearchScope, ChipLook> = {
    map: { label: 'Near the map', icon: MapIcon },
    route: { label: 'Along the route', icon: Route },
};

/** Where to search, the category shortcuts, and the station filters for charging and fuel. */
export const SearchOptions = ({ search }: { search: PlaceSearch }) => (
    <div className="ui-search-options">
        <div className="ui-search-scope">
            <ChipChoice
                label="Search where"
                options={['map', 'route'] as const}
                look={(scope) => scopeLooks[scope]}
                // The scope the search runs in: a route-scoped search falls back to the map while there is no route.
                value={search.alongRoute ? 'route' : 'map'}
                disabled={(scope) => scope === 'route' && !search.canSearchAlongRoute}
                onChange={search.setScope}
            />
            {search.alongRoute && (
                <Select
                    aria-label="Longest detour"
                    options={detourMinuteOptions}
                    optionLabel={(minutes) => `Up to ${minutes} min detour`}
                    value={search.maxDetourMinutes}
                    onChange={search.setMaxDetourMinutes}
                />
            )}
        </div>
        <div className="ui-chip-list" role="group" aria-label="Categories">
            {categoryChips.map(({ categories, ...look }) => {
                const active = search.request?.title === look.label;
                return (
                    <ChipButton
                        key={look.label}
                        look={look}
                        active={active}
                        compact
                        onClick={() =>
                            active ? search.clear() : search.search(categoryRequest(look.label, categories))
                        }
                    />
                );
            })}
        </div>
        {searchesFor(search.request, 'CHARGING_LOCATION') && <ChargingFilters search={search} />}
        {searchesFor(search.request, 'FUEL_STATION') && <FuelFilter search={search} />}
    </div>
);

const powerOptions = [undefined, ...powerStepsKW];

const ChargingFilters = ({ search: { stationFilters, setStationFilters } }: { search: PlaceSearch }) => (
    <fieldset className="ui-station-filters">
        <legend className="ui-form-label">Charging</legend>
        <div className="ui-field-row">
            <Select
                aria-label="Lowest charging power"
                options={powerOptions}
                optionLabel={(kilowatts) => (kilowatts ? `From ${kilowatts} kW` : 'Any power')}
                value={stationFilters.minPowerKW}
                onChange={(minPowerKW) => setStationFilters({ ...stationFilters, minPowerKW })}
            />
            <Select
                aria-label="Highest charging power"
                options={powerOptions}
                optionLabel={(kilowatts) => (kilowatts ? `Up to ${kilowatts} kW` : 'No upper limit')}
                value={stationFilters.maxPowerKW}
                onChange={(maxPowerKW) => setStationFilters({ ...stationFilters, maxPowerKW })}
            />
        </div>
        <ChipChecklist
            label="Connectors"
            options={connectorOptions}
            look={(connector) => ({ label: connectorLabels[connector] })}
            selected={stationFilters.connectors}
            onChange={(connectors) => setStationFilters({ ...stationFilters, connectors })}
        />
    </fieldset>
);

const fuelOptions = [undefined, ...fuels];

const FuelFilter = ({ search: { stationFilters, setStationFilters } }: { search: PlaceSearch }) => (
    <fieldset className="ui-station-filters">
        <legend className="ui-form-label">Fuel</legend>
        <Select
            aria-label="Fuel type"
            options={fuelOptions}
            optionLabel={(fuel) => (fuel ? fuelLabels[fuel] : 'Any fuel')}
            value={stationFilters.fuelTypes?.[0]}
            onChange={(fuel) => setStationFilters({ ...stationFilters, fuelTypes: fuel && [fuel] })}
        />
    </fieldset>
);
