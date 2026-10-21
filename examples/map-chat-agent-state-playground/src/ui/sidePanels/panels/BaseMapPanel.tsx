import type { BaseMapLayerGroupName, BaseMapModuleConfig } from '@tomtom-org/maps-sdk/map';
import { useCallback, useMemo, useState } from 'react';
import { type Agent, useModuleConfigChange } from '../useAgentSnapshot';
import { PanelShell, ToggleRow } from './PanelShell';

const LAYER_GROUPS: { name: BaseMapLayerGroupName; label: string }[] = [
    { name: 'water', label: 'Water' },
    { name: 'borders', label: 'Borders' },
    { name: 'buildings3D', label: '3D buildings' },
    { name: 'buildings2D', label: '2D buildings' },
    { name: 'roads', label: 'Roads' },
    { name: 'roadLabels', label: 'Road labels' },
    { name: 'allPlaceLabels', label: 'Place labels' },
    { name: 'cityLabels', label: 'City labels' },
];

type BaseMapPanelProps = { agent: Agent };

export function BaseMapPanel({ agent }: BaseMapPanelProps) {
    const [hidden, setHidden] = useState<Set<string>>(new Set());

    const getModule = useMemo(() => () => agent.state.baseMap.getBaseMapModule(), [agent]);

    useModuleConfigChange<BaseMapModuleConfig>(getModule, (config) => {
        // The config records every group call, so each event is the whole state.
        const isHidden = (name: BaseMapLayerGroupName) =>
            (config?.groups?.[name]?.visible ?? config?.visible) === false;
        setHidden(new Set(LAYER_GROUPS.map(({ name }) => name).filter(isHidden)));
    });

    const toggleLayer = useCallback(
        async (name: BaseMapLayerGroupName) => {
            const willHide = !hidden.has(name);
            try {
                const baseMapModule = await getModule();
                baseMapModule.setVisible(!willHide, {
                    layerGroups: { show: 'only', values: [name] },
                });
                // setHidden is updated via the config-change event above.
            } catch (error) {
                console.error('Failed to toggle base-map layer group', name, error);
            }
        },
        [getModule, hidden],
    );

    return (
        <PanelShell
            title="Base map layers"
            hint="Hide layers you don't need; the assistant can re-enable them at any time."
        >
            <div className="flex flex-col gap-0.5">
                {LAYER_GROUPS.map(({ name, label }) => (
                    <ToggleRow
                        key={name}
                        checked={!hidden.has(name)}
                        label={label}
                        onChange={() => toggleLayer(name)}
                    />
                ))}
            </div>
        </PanelShell>
    );
}
