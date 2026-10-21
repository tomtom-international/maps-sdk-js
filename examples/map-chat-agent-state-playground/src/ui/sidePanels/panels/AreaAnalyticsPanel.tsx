import type { EntryMode, TrafficAreaAnalyticsEntry } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { EntryModeToggle } from '../EntryModeToggle';
import { type Agent, useSliceSnapshot } from '../useAgentSnapshot';
import type { VisibilityMode } from '../VisibilityToggle';
import { EntryList } from './EntryList';
import { ModeRow } from './ModeRow';
import { PanelShell } from './PanelShell';

type AreaAnalyticsPanelProps = {
    agent: Agent;
    entries: readonly TrafficAreaAnalyticsEntry[];
    onShowDetails: (entry: TrafficAreaAnalyticsEntry) => void;
    onDelete: (entry: TrafficAreaAnalyticsEntry) => void;
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

const summary = (entry: TrafficAreaAnalyticsEntry): string => {
    const regions = entry.data.features.length;
    const word = regions === 1 ? 'region' : 'regions';
    return `${regions} ${word}`;
};

export function AreaAnalyticsPanel({
    agent,
    entries,
    onShowDetails,
    onDelete,
    visibility,
    onVisibilityChange,
}: AreaAnalyticsPanelProps) {
    const entryMode = useSliceSnapshot(
        agent.state.trafficAreaAnalytics.events,
        'mode-change',
        () => agent.state.trafficAreaAnalytics.entryMode,
    );
    const handleModeChange = (mode: EntryMode) => {
        void agent.state.trafficAreaAnalytics
            .setEntryMode(mode)
            .catch((error) => console.error('Failed to set traffic-area-analytics mode', error));
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
            const shown = [...agent.state.trafficAreaAnalytics.shownEntryIds];
            for (const id of shown) {
                await agent.state.trafficAreaAnalytics.hideEntry(id);
            }
        } catch (error) {
            console.error('Failed to clear area analytics', error);
        }
    };

    return (
        <PanelShell
            title="Area analytics"
            hint="Historical traffic aggregations (congestion/speed/travel-time hexes). Pin to keep on the map."
            action={{ label: 'Hide all', onClick: clearShown }}
            controls={
                <ModeRow>
                    <EntryModeToggle value={entryMode} onChange={handleModeChange} />
                </ModeRow>
            }
        >
            <EntryList
                items={items}
                emptyMessage='No analytics yet. Ask the assistant for "traffic last week in …".'
                onShowDetails={handleShow}
                onDelete={handleDelete}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
            />
        </PanelShell>
    );
}
