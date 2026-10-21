import type { EntryMode, PlacesEntry } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { EntryModeToggle } from '../EntryModeToggle';
import { type Agent, useSliceSnapshot } from '../useAgentSnapshot';
import type { VisibilityMode } from '../VisibilityToggle';
import { EntryList } from './EntryList';
import { ModeRow } from './ModeRow';
import { PanelShell } from './PanelShell';

type PlacesPanelProps = {
    agent: Agent;
    entries: readonly PlacesEntry[];
    onShowDetails: (entry: PlacesEntry) => void;
    onDelete: (entry: PlacesEntry) => void;
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

export function PlacesPanel({
    agent,
    entries,
    onShowDetails,
    onDelete,
    visibility,
    onVisibilityChange,
}: PlacesPanelProps) {
    const entryMode = useSliceSnapshot(agent.state.places.events, 'mode-change', () => agent.state.places.entryMode);
    const handleModeChange = (mode: EntryMode) => {
        void agent.state.places.setEntryMode(mode).catch((error) => console.error('Failed to set places mode', error));
    };
    const items = entries.map((entry) => ({
        id: entry.id,
        label: entry.label,
        subtitle: `${entry.data.length} place${entry.data.length === 1 ? '' : 's'}`,
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
            await agent.state.places.clearShownEntries();
        } catch (error) {
            console.error('Failed to clear shown places', error);
        }
    };

    return (
        <PanelShell
            title="Places"
            hint="Pin entries to keep them on the map, or open details to inspect them."
            action={{ label: 'Hide all', onClick: clearShown }}
            controls={
                <ModeRow>
                    <EntryModeToggle value={entryMode} onChange={handleModeChange} />
                </ModeRow>
            }
        >
            <EntryList
                items={items}
                emptyMessage="No places stored yet. Ask the assistant to find some."
                onShowDetails={handleShow}
                onDelete={handleDelete}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
            />
        </PanelShell>
    );
}
