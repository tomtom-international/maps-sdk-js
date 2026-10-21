import type { FilterablePOICategory, FilterShowMode, POIsModuleConfig, ValuesFilter } from '@tomtom-org/maps-sdk/map';
import { useCallback, useMemo, useState } from 'react';
import { Select } from '../../components';
import { type Agent, useModuleConfigChange } from '../useAgentSnapshot';
import { PanelShell, ToggleRow } from './PanelShell';

const CATEGORY_GROUPS: { code: FilterablePOICategory; label: string }[] = [
    { code: 'FOOD_DRINKS_GROUP', label: 'Food & Drinks' },
    { code: 'TRANSPORTATION_GROUP', label: 'Transportation' },
    { code: 'HOLIDAY_TOURISM_GROUP', label: 'Holiday & Tourism' },
    { code: 'HEALTH_GROUP', label: 'Health' },
    { code: 'PARKING_GROUP', label: 'Parking' },
    { code: 'SHOPPING_GROUP', label: 'Shopping' },
    { code: 'ACCOMMODATION_GROUP', label: 'Accommodation' },
    { code: 'ENTERTAINMENT_GROUP', label: 'Entertainment' },
    { code: 'GOVERNMENT_GROUP', label: 'Government Organizations' },
    { code: 'EDUCATION_GROUP', label: 'Education' },
    { code: 'GAS_STATIONS_GROUP', label: 'Gas Stations' },
    { code: 'EV_CHARGING_STATIONS_GROUP', label: 'EV Charging Stations' },
];

const MODE_OPTIONS: { value: FilterShowMode; label: string }[] = [
    { value: 'all-except', label: 'All Except' },
    { value: 'only', label: 'Only' },
];

const DEFAULT_FILTER: ValuesFilter<FilterablePOICategory> = { show: 'all-except', values: [] };

type MapPOIsPanelProps = { agent: Agent };

export function MapPOIsPanel({ agent }: MapPOIsPanelProps) {
    const [mode, setMode] = useState<FilterShowMode>(DEFAULT_FILTER.show);
    const [selected, setSelected] = useState<Set<FilterablePOICategory>>(new Set());

    const getModule = useMemo(() => () => agent.state.mapPOIs.getPOIsModule(), [agent]);

    useModuleConfigChange<POIsModuleConfig>(getModule, (config) => {
        const filter = config?.filters?.categories;
        if (!filter) {
            setMode(DEFAULT_FILTER.show);
            setSelected(new Set());
            return;
        }
        setMode(filter.show);
        setSelected(new Set(filter.values as FilterablePOICategory[]));
    });

    const applyFilter = useCallback(
        async (filter: ValuesFilter<FilterablePOICategory>) => {
            try {
                const poisModule = await getModule();
                poisModule.updateConfig({ filters: { categories: filter } });
            } catch (error) {
                console.error('Failed to apply POI filter', error);
            }
        },
        [getModule],
    );

    const toggleCategory = (code: FilterablePOICategory) => {
        const next = new Set(selected);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        setSelected(next);
        void applyFilter({ show: mode, values: [...next] });
    };

    const changeMode = (next: FilterShowMode) => {
        setMode(next);
        void applyFilter({ show: next, values: [...selected] });
    };

    const reset = async () => {
        setMode(DEFAULT_FILTER.show);
        setSelected(new Set());
        try {
            const poisModule = await getModule();
            poisModule.updateConfig({ filters: { categories: DEFAULT_FILTER } });
        } catch (error) {
            console.error('Failed to reset POIs', error);
        }
    };

    return (
        <PanelShell
            title="Built-in POIs"
            hint="Pick a filter mode, then choose which category groups it applies to."
            action={{ label: 'Reset', onClick: reset }}
        >
            <Select<FilterShowMode> label="Filter Mode" value={mode} options={MODE_OPTIONS} onChange={changeMode} />
            <div className="flex flex-col gap-0.5 border-t border-(--ui-border-low-em) pt-2">
                {CATEGORY_GROUPS.map(({ code, label }) => (
                    <ToggleRow
                        key={code}
                        checked={selected.has(code)}
                        label={label}
                        onChange={() => toggleCategory(code)}
                    />
                ))}
            </div>
        </PanelShell>
    );
}
