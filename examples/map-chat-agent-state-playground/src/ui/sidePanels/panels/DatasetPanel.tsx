import type { DatasetMode, DatasetModeSliceName } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { DatasetModeToggle } from '../DatasetModeToggle';
import { type Agent, useSliceSnapshot } from '../useAgentSnapshot';
import type { VisibilityMode } from '../VisibilityToggle';
import { DatasetList } from './DatasetList';
import { ModeRow } from './ModeRow';
import { PanelShell } from './PanelShell';

type PanelDataset = { id: string; label: string; timestamp: number };

/** What the rail hands every dataset panel. */
export type SlicePanelProps<D extends PanelDataset> = {
    agent: Agent;
    datasets: readonly D[];
    onShowDetails: (dataset: D) => void;
    onDelete: (dataset: D) => void;
    visibility: (id: string) => VisibilityMode;
    onVisibilityChange: (id: string, mode: VisibilityMode) => void;
};

type DatasetPanelProps<D extends PanelDataset> = Omit<SlicePanelProps<D>, 'agent'> & {
    slice: Agent['state'][DatasetModeSliceName];
    /** Names the slice in console errors. */
    noun: string;
    title: string;
    hint: string;
    emptyMessage: string;
    summary: (dataset: D) => string;
};

/** One slice's datasets: the dataset-mode toggle, a "Hide all" action and the dataset list. */
export function DatasetPanel<D extends PanelDataset>({
    slice,
    noun,
    title,
    hint,
    emptyMessage,
    summary,
    datasets,
    onShowDetails,
    onDelete,
    visibility,
    onVisibilityChange,
}: DatasetPanelProps<D>) {
    const datasetMode = useSliceSnapshot(slice.events, 'mode-change', () => slice.datasetMode);
    const handleModeChange = (mode: DatasetMode) => {
        void slice.setDatasetMode(mode).catch((error) => console.error(`Failed to set ${noun} mode`, error));
    };

    const items = datasets.map((dataset) => ({
        id: dataset.id,
        label: dataset.label,
        subtitle: summary(dataset),
        timestamp: dataset.timestamp,
    }));

    const withDataset = (handler: (dataset: D) => void) => (id: string) => {
        const dataset = datasets.find((candidate) => candidate.id === id);
        if (dataset) handler(dataset);
    };

    const clearShown = async () => {
        try {
            await slice.clearShown();
        } catch (error) {
            console.error(`Failed to clear shown ${noun}`, error);
        }
    };

    return (
        <PanelShell
            title={title}
            hint={hint}
            action={{ label: 'Hide all', onClick: clearShown }}
            controls={
                <ModeRow>
                    <DatasetModeToggle value={datasetMode} onChange={handleModeChange} />
                </ModeRow>
            }
        >
            <DatasetList
                items={items}
                emptyMessage={emptyMessage}
                onShowDetails={withDataset(onShowDetails)}
                onDelete={withDataset(onDelete)}
                visibility={visibility}
                onVisibilityChange={onVisibilityChange}
            />
        </PanelShell>
    );
}
