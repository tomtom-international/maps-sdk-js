import type { TrafficFlowModuleConfig, TrafficIncidentsModuleConfig } from '@tomtom-org/maps-sdk/map';
import { useCallback, useMemo, useState } from 'react';
import { type Agent, useModuleConfigChange } from '../useAgentSnapshot';
import { PanelShell, ToggleRow } from './PanelShell';

type TrafficPanelProps = { agent: Agent };

export function TrafficPanel({ agent }: TrafficPanelProps) {
    const [flowVisible, setFlowVisible] = useState(false);
    const [incidentsVisible, setIncidentsVisible] = useState(false);

    const getFlowModule = useMemo(() => () => agent.state.trafficTiles.getTrafficFlowModule(), [agent]);
    const getIncidentsModule = useMemo(() => () => agent.state.trafficTiles.getTrafficIncidentsModule(), [agent]);

    useModuleConfigChange<TrafficFlowModuleConfig>(getFlowModule, (config) => {
        if (config && typeof config.visible === 'boolean') setFlowVisible(config.visible);
    });
    useModuleConfigChange<TrafficIncidentsModuleConfig>(getIncidentsModule, (config) => {
        if (config && typeof config.visible === 'boolean') setIncidentsVisible(config.visible);
    });

    const toggleFlow = useCallback(async () => {
        try {
            const module = await getFlowModule();
            module.setVisible(!flowVisible);
        } catch (error) {
            console.error('Failed to toggle traffic flow', error);
        }
    }, [getFlowModule, flowVisible]);

    const toggleIncidents = useCallback(async () => {
        try {
            const module = await getIncidentsModule();
            module.setVisible(!incidentsVisible);
        } catch (error) {
            console.error('Failed to toggle traffic incidents', error);
        }
    }, [getIncidentsModule, incidentsVisible]);

    return (
        <PanelShell
            title="Real-time traffic"
            hint="For historical analytics use the chat: “show me traffic last week in Amsterdam”."
        >
            <div className="flex flex-col gap-0.5">
                <ToggleRow checked={flowVisible} label="Traffic flow (live speeds)" onChange={toggleFlow} />
                <ToggleRow
                    checked={incidentsVisible}
                    label="Incidents (jams, accidents, closures)"
                    onChange={toggleIncidents}
                />
            </div>
        </PanelShell>
    );
}
