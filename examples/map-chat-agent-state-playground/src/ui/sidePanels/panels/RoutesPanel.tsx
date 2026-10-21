import type { EntryMode, RoutesEntry } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { EntryModeToggle } from '../EntryModeToggle';
import { type Agent, useSliceSnapshot } from '../useAgentSnapshot';
import type { VisibilityMode } from '../VisibilityToggle';
import { EntryList } from './EntryList';
import { ModeRow } from './ModeRow';
import { PanelShell } from './PanelShell';

type RoutesPanelProps = {
    agent: Agent;
    entries: readonly RoutesEntry[];
    onShowDetails: (entry: RoutesEntry) => void;
    onDelete: (entry: RoutesEntry) => void;
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

const summary = (entry: RoutesEntry): string => {
    const main = entry.data.features[0]?.properties?.summary;
    if (!main) return `${entry.data.features.length} route${entry.data.features.length === 1 ? '' : 's'}`;
    const km = Math.round(main.lengthInMeters / 1000);
    const min = Math.round(main.travelTimeInSeconds / 60);
    const alts = entry.data.features.length - 1;
    return `${km} km · ${min} min${alts > 0 ? ` · +${alts} alt` : ''}`;
};

export function RoutesPanel({
    agent,
    entries,
    onShowDetails,
    onDelete,
    visibility,
    onVisibilityChange,
}: RoutesPanelProps) {
    const entryMode = useSliceSnapshot(agent.state.routing.events, 'mode-change', () => agent.state.routing.entryMode);
    const handleModeChange = (mode: EntryMode) => {
        void agent.state.routing.setEntryMode(mode).catch((error) => console.error('Failed to set routes mode', error));
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
            // Multi-show capable — hide every currently-shown entry, not just one.
            const shown = [...agent.state.routing.shownEntryIds];
            await Promise.all(shown.map((id) => agent.state.routing.hideEntry(id)));
        } catch (error) {
            console.error('Failed to clear routes', error);
        }
    };

    return (
        <PanelShell
            title="Routes"
            hint="Pin a route to overlay it permanently, or open details for the route stats."
            action={{ label: 'Hide all', onClick: clearShown }}
            controls={
                <ModeRow>
                    <EntryModeToggle value={entryMode} onChange={handleModeChange} />
                </ModeRow>
            }
        >
            <EntryList
                items={items}
                emptyMessage="No routes calculated yet. Ask the assistant to plan one."
                onShowDetails={handleShow}
                onDelete={handleDelete}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
            />
        </PanelShell>
    );
}
