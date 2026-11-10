import {
    type BYODDataset,
    type CustomGeometriesDataset,
    type PlacesDataset,
    type RangesDataset,
    type RoutesDataset,
    rangesOf,
    type TrafficAreaAnalyticsDataset,
    type TrafficIncidentsDataset,
} from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useMemo } from 'react';
import { AnalysisChart } from '../../chat';
import { countLabel } from './countLabel';
import { type Agent, useAgentSnapshot } from './useAgentSnapshot';

/**
 * A dataset the rail selected, tagged by its kind — avoids structural sniffing across dataset shapes that
 * share a `FeatureCollection`-shaped `data` (routes vs traffic-area-analytics).
 */
export type RailSelection =
    | { kind: 'places'; dataset: PlacesDataset }
    | { kind: 'routes'; dataset: RoutesDataset }
    | { kind: 'ranges'; dataset: RangesDataset }
    | { kind: 'geometries'; dataset: CustomGeometriesDataset }
    | { kind: 'byod'; dataset: BYODDataset }
    | { kind: 'incidents'; dataset: TrafficIncidentsDataset }
    | { kind: 'areaAnalytics'; dataset: TrafficAreaAnalyticsDataset };

export type RailKind = RailSelection['kind'];

type DatasetDetailsContentProps = {
    selection: RailSelection;
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

const ITEM_UNITS: Record<RailKind, string> = {
    places: 'place',
    routes: 'route',
    ranges: 'range',
    geometries: 'feature',
    byod: 'feature',
    incidents: 'incident',
    areaAnalytics: 'region',
};

const itemCount = (selection: RailSelection): number =>
    selection.kind === 'ranges' ? rangesOf(selection.dataset.data).length : selection.dataset.data.features.length;

function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4 text-[12px] leading-[16px]">
            <span className="text-(--ui-text-low-em)">{label}</span>
            <span className="text-right font-medium text-(--ui-text-high-em)">{value}</span>
        </div>
    );
}

// One-line label for where a BYOD dataset came from, matching the kinds the slice records
// (integrator, url, inline).
const byodSource = (source: BYODDataset['producedFrom']): string => {
    switch (source.kind) {
        case 'url':
            return source.url;
        case 'inline':
            return source.description ?? 'inline GeoJSON';
        case 'integrator':
            return source.description ?? 'seeded by the app';
    }
};

export function DatasetDetailsContent({ selection, agent }: DatasetDetailsContentProps) {
    const { dataset } = selection;
    // Analyses live in the session-level registry, not on the dataset — read them on demand for this dataset
    // and re-render whenever any analysis recomputes. (Mounted with a per-dataset `key`, so the initial
    // snapshot is fresh on selection change.)
    const allAnalyses = useAgentSnapshot(
        useMemo(() => [{ events: agent.state.analyses.events, types: ['analysis-change'] }], [agent]),
        () => agent.state.analyses.getAnalysesForDataset(dataset.id),
    );
    const charts = allAnalyses.filter((a) => a.outputFormat === 'chart');
    const isSingleAnalysis = charts.length === 1;
    const producedFrom = selection.kind === 'geometries' ? selection.dataset.producedFrom : undefined;
    const byod = selection.kind === 'byod' ? selection.dataset : undefined;
    const byodProfile = byod && agent.state.byod.profile(byod.id);

    return (
        <div className="flex flex-col">
            <div className="flex flex-col gap-1 border-b border-(--ui-border-low-em) bg-(--ui-surface-1) px-3 py-2">
                <StatRow label="Label" value={dataset.label} />
                <StatRow label="ID" value={dataset.id} />
                <StatRow label="Items" value={countLabel(itemCount(selection), ITEM_UNITS[selection.kind])} />
                <StatRow label="Last modified" value={formatTimestamp(dataset.timestamp)} />
                {producedFrom && <StatRow label="Operation" value={producedFrom.operation ?? 'custom'} />}
                {producedFrom && producedFrom.sourceIds.length > 0 && (
                    <div className="flex flex-col gap-0.5 pt-1 text-[12px] leading-[16px]">
                        <span className="text-(--ui-text-low-em)">Sources</span>
                        <ul className="flex flex-col gap-0.5">
                            {producedFrom.sourceIds.map((source) => {
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
                {byod && <StatRow label="Source" value={byodSource(byod.producedFrom)} />}
                {byodProfile && byodProfile.geometryTypes.length > 0 && (
                    <StatRow label="Geometry" value={byodProfile.geometryTypes.join(', ')} />
                )}
            </div>

            {byodProfile && (
                <div className="flex flex-col gap-1 border-b border-(--ui-border-low-em) px-3 py-3">
                    <strong className="text-[13px] font-semibold text-(--ui-text-high-em)">Inferred schema</strong>
                    {byodProfile.properties.length === 0 ? (
                        <span className="text-[11px] text-(--ui-text-low-em)">No feature properties.</span>
                    ) : (
                        <ul className="flex flex-col gap-1.5">
                            {byodProfile.properties.map((property) => (
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
                    {byodProfile.propertiesOmitted ? (
                        <span className="text-[11px] text-(--ui-text-low-em)">
                            +{byodProfile.propertiesOmitted} more {byodProfile.propertiesOmitted === 1 ? 'key' : 'keys'}
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
