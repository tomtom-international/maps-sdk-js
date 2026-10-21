import type { EntryMode, TrafficIncidentsEntry } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { EntryModeToggle } from '../EntryModeToggle';
import { type Agent, useSliceSnapshot } from '../useAgentSnapshot';
import type { VisibilityMode } from '../VisibilityToggle';
import { EntryList } from './EntryList';
import { ModeRow } from './ModeRow';
import { PanelShell } from './PanelShell';

type IncidentsPanelProps = {
    agent: Agent;
    entries: readonly TrafficIncidentsEntry[];
    onShowDetails: (entry: TrafficIncidentsEntry) => void;
    onDelete: (entry: TrafficIncidentsEntry) => void;
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

const summary = (entry: TrafficIncidentsEntry): string => {
    const count = entry.data.length;
    const word = count === 1 ? 'incident' : 'incidents';
    return `${count} ${word}`;
};

export function IncidentsPanel({
    agent,
    entries,
    onShowDetails,
    onDelete,
    visibility,
    onVisibilityChange,
}: IncidentsPanelProps) {
    const entryMode = useSliceSnapshot(
        agent.state.trafficIncidents.events,
        'mode-change',
        () => agent.state.trafficIncidents.entryMode,
    );
    const handleModeChange = (mode: EntryMode) => {
        void agent.state.trafficIncidents
            .setEntryMode(mode)
            .catch((error) => console.error('Failed to set incidents mode', error));
    };

    const items = entries.map((entry) => ({
        id: entry.id,
        label: entry.label,
        subtitle: summary(entry),
        timestamp: entry.timestamp,
    }));

    const findEntry = (id: string) => entries.find((e) => e.id === id);
    const handleShow = (id: string) => {
        const entry = findEntry(id);
        if (entry) onShowDetails(entry);
    };
    const handleDelete = (id: string) => {
        const entry = findEntry(id);
        if (entry) onDelete(entry);
    };

    const clearShown = async () => {
        try {
            // Sequential — concurrent show/hide/clear calls race the SDK/MapLibre state machine.
            const shown = [...agent.state.trafficIncidents.shownEntryIds];
            for (const id of shown) {
                await agent.state.trafficIncidents.hideEntry(id);
            }
        } catch (error) {
            console.error('Failed to clear incidents', error);
        }
    };

    return (
        <PanelShell
            title="Traffic incidents"
            hint="Per-area incident snapshots fetched by the agent. Pin to keep on the map, or open details."
            action={{ label: 'Hide all', onClick: clearShown }}
            controls={
                <ModeRow>
                    <EntryModeToggle value={entryMode} onChange={handleModeChange} />
                </ModeRow>
            }
        >
            <EntryList
                items={items}
                emptyMessage='No incident snapshots yet. Ask the assistant for "incidents around …".'
                onShowDetails={handleShow}
                onDelete={handleDelete}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
            />
        </PanelShell>
    );
}
