import type { BYODEntry, EntryMode } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { EntryModeToggle } from '../EntryModeToggle';
import { type Agent, useSliceSnapshot } from '../useAgentSnapshot';
import type { VisibilityMode } from '../VisibilityToggle';
import { EntryList } from './EntryList';
import { ModeRow } from './ModeRow';
import { PanelShell } from './PanelShell';

type ByodPanelProps = {
    agent: Agent;
    entries: readonly BYODEntry[];
    onShowDetails: (entry: BYODEntry) => void;
    onDelete: (entry: BYODEntry) => void;
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

const SOURCE_LABELS: Record<BYODEntry['source']['kind'], string> = {
    integrator: 'app-seeded',
    url: 'url',
    inline: 'inline',
};

// Compact "what is this layer" summary built from the runtime profile — source
// origin, feature count, and the geometry types present, so the user can scan
// at a glance ("url · 42 features · Point, Polygon") instead of opening details.
const summary = (entry: BYODEntry): string => {
    const featureWord = entry.profile.featureCount === 1 ? 'feature' : 'features';
    const geometry = entry.profile.geometryTypes.join(', ') || 'no geometry';
    return `${SOURCE_LABELS[entry.source.kind]} · ${entry.profile.featureCount} ${featureWord} · ${geometry}`;
};

export function ByodPanel({ agent, entries, onShowDetails, onDelete, visibility, onVisibilityChange }: ByodPanelProps) {
    const entryMode = useSliceSnapshot(agent.state.byod.events, 'mode-change', () => agent.state.byod.entryMode);
    const handleModeChange = (mode: EntryMode) => {
        void agent.state.byod.setEntryMode(mode).catch((error) => console.error('Failed to set BYOD mode', error));
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
            const shown = [...agent.state.byod.shownEntryIds];
            for (const id of shown) {
                await agent.state.byod.hideEntry(id);
            }
        } catch (error) {
            console.error('Failed to clear BYOD layers', error);
        }
    };

    return (
        <PanelShell
            title="Bring your own data"
            hint="Customer-authored GeoJSON layers the assistant can read, render, and pipe through analyse / process. Pin to keep on the map or open details for the inferred schema."
            action={{ label: 'Hide all', onClick: clearShown }}
            controls={
                <ModeRow>
                    <EntryModeToggle value={entryMode} onChange={handleModeChange} />
                </ModeRow>
            }
        >
            <EntryList
                items={items}
                emptyMessage="No BYOD layers yet. Seed one from the embedding app, or ask the assistant to add GeoJSON from a URL or inline data."
                onShowDetails={handleShow}
                onDelete={handleDelete}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
            />
        </PanelShell>
    );
}
