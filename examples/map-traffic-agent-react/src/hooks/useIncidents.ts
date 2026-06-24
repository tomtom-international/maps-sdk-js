import { useEffect, useState } from 'react';
import type { IncidentsSnapshot } from './types';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * The example surfaces a single snapshot at a time on the heatmap + triage
 * panel. The toolkit supports multi-entry rendering via per-entry modules, but
 * the demo intentionally tracks just the latest entry's data + label.
 */
export function useIncidents(agent: AgentInstance | undefined) {
    const [incidents, setIncidents] = useState<IncidentsSnapshot>({ label: '', items: [] });

    useEffect(() => {
        if (!agent) return;
        const unsub = agent.state.trafficIncidents.events.on('entries-change', ({ entries }) => {
            const latest = entries.length > 0 ? entries[entries.length - 1] : undefined;
            if (latest) {
                setIncidents({ label: latest.label, items: latest.data });
            } else {
                setIncidents({ label: '', items: [] });
            }
        });
        return () => {
            unsub();
            setIncidents({ label: '', items: [] });
        };
    }, [agent]);

    return { incidents };
}
