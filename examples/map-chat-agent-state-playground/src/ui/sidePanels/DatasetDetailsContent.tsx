import type {
    BYODDataset,
    CustomGeometriesDataset,
    PlacesDataset,
    RangesDataset,
    RoutesDataset,
    TrafficAreaAnalyticsDataset,
    TrafficIncidentsDataset,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useMemo } from 'react';
import { AnalysisChart } from '../../chat';
import { type Agent, useAgentSnapshot } from './useAgentSnapshot';

type AnyDataset =
    | PlacesDataset
    | RoutesDataset
    | RangesDataset
    | CustomGeometriesDataset
    | BYODDataset
    | TrafficIncidentsDataset
    | TrafficAreaAnalyticsDataset;

type RailKind = 'places' | 'routes' | 'ranges' | 'geometries' | 'byod' | 'incidents' | 'areaAnalytics';

type DatasetDetailsContentProps = {
    dataset: AnyDataset;
    /**
     * Discriminator from the rail — avoids structural sniffing across dataset shapes that
     * share a `FeatureCollection`-shaped `data` (routes vs traffic-area-analytics).
     */
    kind: RailKind;
    /** Agent handle — analyses are read on demand from the session-level `state.analyses` registry. */
    agent: Agent;
};

const formatTimestamp = (ts: number): string =>
    new Date(ts).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const itemCount = (dataset: AnyDataset, kind: RailKind): { count: number; unit: string } => {
    switch (kind) {
        case 'places':
            return { count: (dataset as PlacesDataset).data.length, unit: 'place' };
        case 'routes':
            return { count: (dataset as RoutesDataset).data.features.length, unit: 'route' };
        case 'ranges':
            return { count: (dataset as RangesDataset).data?.length ?? 0, unit: 'range' };
        case 'geometries':
            return { count: (dataset as CustomGeometriesDataset).data.length, unit: 'feature' };
        case 'byod':
            return { count: (dataset as BYODDataset).profile.featureCount, unit: 'feature' };
        case 'incidents':
            return { count: (dataset as TrafficIncidentsDataset).data.length, unit: 'incident' };
        case 'areaAnalytics':
            return { count: (dataset as TrafficAreaAnalyticsDataset).data.features.length, unit: 'region' };
    }
};

function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4 text-[12px] leading-[16px]">
            <span className="text-(--ui-text-low-em)">{label}</span>
            <span className="text-right font-medium text-(--ui-text-high-em)">{value}</span>
        </div>
    );
}

type Analysis = { name: string; description?: string; outputFormat: string; data: unknown };

// One-line provenance string for a BYOD dataset's source, mirroring the LLM-facing
// labels the slice uses (integrator / url / inline).
const byodSource = (source: BYODDataset['source']): string => {
    switch (source.kind) {
        case 'url':
            return source.url;
        case 'inline':
            return source.description ?? 'inline GeoJSON';
        case 'integrator':
            return source.description ?? 'seeded by the app';
    }
};

export function DatasetDetailsContent({ dataset, kind, agent }: DatasetDetailsContentProps) {
    // Analyses live in the session-level registry, not on the dataset — read them on demand for this dataset
    // and re-render whenever any analysis recomputes. (Mounted with a per-dataset `key`, so the initial
    // snapshot is fresh on selection change.)
    const allAnalyses = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.analyses.events, types: ['analysis-change'] }], [agent]),
        () => agent.state.analyses.getAnalysesForDataset(dataset.id) as readonly Analysis[],
    );
    const charts = allAnalyses.filter((a) => a.outputFormat === 'chart');
    const { count, unit } = itemCount(dataset, kind);
    const isSingleAnalysis = charts.length === 1;
    const provenance = kind === 'geometries' ? (dataset as CustomGeometriesDataset).provenance : undefined;
    const byod = kind === 'byod' ? (dataset as BYODDataset) : undefined;

    return (
        <div className="flex flex-col">
            <div className="flex flex-col gap-1 border-b border-(--ui-border-low-em) bg-(--ui-surface-1) px-3 py-2">
                <StatRow label="Label" value={dataset.label} />
                <StatRow label="ID" value={dataset.id} />
                <StatRow label="Items" value={`${count} ${unit}${count === 1 ? '' : 's'}`} />
                <StatRow label="Last modified" value={formatTimestamp(dataset.timestamp)} />
                {provenance && <StatRow label="Operation" value={provenance.operation ?? 'custom'} />}
                {provenance && provenance.sourceIds.length > 0 && (
                    <div className="flex flex-col gap-0.5 pt-1 text-[12px] leading-[16px]">
                        <span className="text-(--ui-text-low-em)">Sources</span>
                        <ul className="flex flex-col gap-0.5">
                            {provenance.sourceIds.map((source) => {
                                const display = `${source.kind}:${source.id}`;
                                return (
                                    <li
                                        key={display}
                                        className="truncate font-mono text-[11px] text-(--ui-text-med-em)"
                                        title={display}
                                    >
                                        {display}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
                {byod && <StatRow label="Source" value={byodSource(byod.source)} />}
                {byod && byod.profile.geometryTypes.length > 0 && (
                    <StatRow label="Geometry" value={byod.profile.geometryTypes.join(', ')} />
                )}
            </div>

            {byod && (
                <div className="flex flex-col gap-1 border-b border-(--ui-border-low-em) px-3 py-3">
                    <strong className="text-[13px] font-semibold text-(--ui-text-high-em)">Inferred schema</strong>
                    {byod.profile.properties.length === 0 ? (
                        <span className="text-[11px] text-(--ui-text-low-em)">No feature properties.</span>
                    ) : (
                        <ul className="flex flex-col gap-1.5">
                            {byod.profile.properties.map((property) => (
                                <li key={property.name} className="flex flex-col gap-0.5 text-[11px] leading-[15px]">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <span
                                            className="truncate font-mono text-(--ui-text-high-em)"
                                            title={property.name}
                                        >
                                            {property.name}
                                        </span>
                                        <span className="shrink-0 text-(--ui-text-low-em)">
                                            {property.types.join(' | ')} · {Math.round(property.coverage * 100)}%
                                        </span>
                                    </div>
                                    {property.examples.length > 0 && (
                                        <span
                                            className="truncate text-(--ui-text-med-em)"
                                            title={property.examples.join(', ')}
                                        >
                                            e.g. {property.examples.join(', ')}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {byod.profile.propertiesOmitted ? (
                        <span className="text-[11px] text-(--ui-text-low-em)">
                            +{byod.profile.propertiesOmitted} more{' '}
                            {byod.profile.propertiesOmitted === 1 ? 'key' : 'keys'}
                        </span>
                    ) : null}
                </div>
            )}

            {allAnalyses.length > 0 && (
                <div className="flex flex-col gap-1 border-b border-(--ui-border-low-em) px-3 py-3">
                    <strong className="text-[13px] font-semibold text-(--ui-text-high-em)">
                        Analyses ({allAnalyses.length})
                    </strong>
                    <ul className="flex flex-col gap-1">
                        {allAnalyses.map((analysis) => (
                            <li key={analysis.name} className="flex items-center justify-between gap-2 text-[11px]">
                                <span
                                    className="min-w-0 flex-1 truncate text-(--ui-text-high-em)"
                                    title={analysis.name}
                                >
                                    {analysis.name}
                                </span>
                                <span className="shrink-0 text-(--ui-text-low-em)">
                                    {analysis.outputFormat === 'chart' ? 'chart' : 'json'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex flex-col">
                {charts.length === 0 ? (
                    <div className="px-3 py-4 text-center text-[11px] text-(--ui-text-low-em)">
                        {allAnalyses.length === 0
                            ? 'No analyses yet.'
                            : 'JSON analyses are listed above and echoed in the chat; charts render here.'}
                    </div>
                ) : (
                    charts.map((analysis, idx) =>
                        isSingleAnalysis ? (
                            <section
                                key={analysis.name}
                                className="flex flex-col gap-1 px-3 py-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-(--ui-border-low-em)"
                            >
                                <header className="flex flex-col gap-0.5">
                                    <strong className="text-[13px] font-semibold text-(--ui-text-high-em)">
                                        {analysis.name}
                                    </strong>
                                    {analysis.description && (
                                        <span className="text-[11px] text-(--ui-text-low-em)">
                                            {analysis.description}
                                        </span>
                                    )}
                                </header>
                                <AnalysisChart config={analysis.data} />
                            </section>
                        ) : (
                            <details
                                key={analysis.name}
                                open={idx === 0}
                                className="border-b border-(--ui-border-low-em) last:border-b-0"
                            >
                                <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-[13px] font-semibold text-(--ui-text-high-em) hover:bg-(--ui-surface-1)">
                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className="truncate">{analysis.name}</span>
                                        {analysis.description && (
                                            <span className="truncate text-[11px] font-normal text-(--ui-text-low-em)">
                                                {analysis.description}
                                            </span>
                                        )}
                                    </span>
                                    <span
                                        aria-hidden
                                        className="text-[12px] text-(--ui-text-med-em) transition-transform group-open:rotate-90"
                                    >
                                        ▸
                                    </span>
                                </summary>
                                <div className="px-3 pb-3">
                                    <AnalysisChart config={analysis.data} />
                                </div>
                            </details>
                        ),
                    )
                )}
            </div>
        </div>
    );
}
