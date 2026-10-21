import type { CustomGeometriesEntry, EntryMode } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { EntryModeToggle } from '../EntryModeToggle';
import { type Agent, useSliceSnapshot } from '../useAgentSnapshot';
import type { VisibilityMode } from '../VisibilityToggle';
import { EntryList } from './EntryList';
import { ModeRow } from './ModeRow';
import { PanelShell } from './PanelShell';

type GeometriesPanelProps = {
    agent: Agent;
    entries: readonly CustomGeometriesEntry[];
    onShowDetails: (entry: CustomGeometriesEntry) => void;
    onDelete: (entry: CustomGeometriesEntry) => void;
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

const KIND_LABELS: Record<string, string> = {
    place: 'place',
    places: 'places-entries',
    ranges: 'ranges',
    custom: 'custom',
};

// Compact "what fed this entry" summary built from the tagged source list — counts each
// `kind` so the user can scan at a glance ("union · 3 places + 1 ranges") instead of
// reading every id verbatim.
const summary = (entry: CustomGeometriesEntry): string => {
    const counts: Record<string, number> = {};
    for (const source of entry.provenance.sourceIds) {
        counts[source.kind] = (counts[source.kind] ?? 0) + 1;
    }
    const breakdown =
        Object.entries(counts)
            .map(([kind, count]) => `${count} ${KIND_LABELS[kind] ?? kind}`)
            .join(' + ') || 'no sources';
    const op = entry.provenance.operation ?? 'custom';
    const featureWord = entry.data.length === 1 ? 'feature' : 'features';
    return `${op} · ${entry.data.length} ${featureWord} · ${breakdown}`;
};

export function GeometriesPanel({
    agent,
    entries,
    onShowDetails,
    onDelete,
    visibility,
    onVisibilityChange,
}: GeometriesPanelProps) {
    const entryMode = useSliceSnapshot(
        agent.state.customGeometries.events,
        'mode-change',
        () => agent.state.customGeometries.entryMode,
    );
    const handleModeChange = (mode: EntryMode) => {
        void agent.state.customGeometries
            .setEntryMode(mode)
            .catch((error) => console.error('Failed to set custom-geometries mode', error));
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
            // Sequential, not Promise.all — concurrent show/hide/clear calls race the
            // SDK and MapLibre state machine. Await one at a time.
            const shown = [...agent.state.customGeometries.shownEntryIds];
            for (const id of shown) {
                await agent.state.customGeometries.hideEntry(id);
            }
        } catch (error) {
            console.error('Failed to clear custom geometries', error);
        }
    };

    return (
        <PanelShell
            title="Custom geometries"
            hint="Polygons produced by processGeometries — unions, buffers, h3 coverage. Pin to keep on the map or open details for analyses."
            action={{ label: 'Hide all', onClick: clearShown }}
            controls={
                <ModeRow>
                    <EntryModeToggle value={entryMode} onChange={handleModeChange} />
                </ModeRow>
            }
        >
            <EntryList
                items={items}
                emptyMessage="No custom geometries yet. Ask the assistant to union, buffer, or compute coverage of polygons."
                onShowDetails={handleShow}
                onDelete={handleDelete}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
            />
        </PanelShell>
    );
}
