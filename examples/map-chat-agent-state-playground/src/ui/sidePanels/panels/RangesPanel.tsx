import type { EntryMode, RangesEntry } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { EntryModeToggle } from '../EntryModeToggle';
import { type Agent, useSliceSnapshot } from '../useAgentSnapshot';
import type { VisibilityMode } from '../VisibilityToggle';
import { EntryList } from './EntryList';
import { ModeRow } from './ModeRow';
import { PanelShell } from './PanelShell';

type RangesPanelProps = {
    agent: Agent;
    entries: readonly RangesEntry[];
    onShowDetails: (entry: RangesEntry) => void;
    onDelete: (entry: RangesEntry) => void;
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

const summary = (entry: RangesEntry): string => {
    // Multi-origin entries carry the same budgets across every range, so we
    // sample the first range for the budget summary and prefix the origin
    // count to disambiguate "30 min from one place" vs "30 min from three".
    const budgets = entry.data[0]?.budgets ?? [];
    const budgetStr = budgets
        .map((b) => {
            if (b.type === 'timeMinutes') return `${b.value} min`;
            if (b.type === 'distanceKM') return `${b.value} km`;
            return `${b.value} ${b.type}`;
        })
        .join(', ');
    return entry.data.length === 1 ? budgetStr : `${entry.data.length} origins · ${budgetStr}`;
};

export function RangesPanel({
    agent,
    entries,
    onShowDetails,
    onDelete,
    visibility,
    onVisibilityChange,
}: RangesPanelProps) {
    const entryMode = useSliceSnapshot(agent.state.ranges.events, 'mode-change', () => agent.state.ranges.entryMode);
    const handleModeChange = (mode: EntryMode) => {
        void agent.state.ranges.setEntryMode(mode).catch((error) => console.error('Failed to set ranges mode', error));
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
            // hideEntry handles polygon + origin-pin clears AND emits
            // shown-change. Walk every currently-shown id.
            const shown = [...agent.state.ranges.shownEntryIds];
            await Promise.all(shown.map((id) => agent.state.ranges.hideEntry(id)));
        } catch (error) {
            console.error('Failed to clear ranges', error);
        }
    };

    return (
        <PanelShell
            title="Reachable ranges"
            hint="Pin a range to keep it on the map, or open details for its analyses."
            action={{ label: 'Hide all', onClick: clearShown }}
            controls={
                <ModeRow>
                    <EntryModeToggle value={entryMode} onChange={handleModeChange} />
                </ModeRow>
            }
        >
            <EntryList
                items={items}
                emptyMessage="No ranges computed yet. Ask the assistant for an isochrone."
                onShowDetails={handleShow}
                onDelete={handleDelete}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
            />
        </PanelShell>
    );
}
