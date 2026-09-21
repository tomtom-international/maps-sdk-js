import type { Cluster } from '../agent/types';
import { formatDelay } from '../utils/format';
import { PanelCard, StatusTag, type StatusTone } from './components';

const TREND_BADGE: Record<string, { label: string; tone?: StatusTone; accent?: string }> = {
    growing: { label: '↑ Growing', tone: 'error' },
    fading: { label: '↓ Fading', tone: 'success' },
    steady: { label: '→ Steady', tone: 'info' },
    new: { label: '★ New', accent: 'var(--ui-surface-brand-red)' },
};

export type ClusterPanelProps = {
    clusters: readonly Cluster[];
    focusedIds: ReadonlySet<string>;
    onFocusCluster: (cluster: Cluster) => void;
    onClearClusters: () => void;
};

export function ClusterPanel({ clusters, focusedIds, onFocusCluster, onClearClusters }: ClusterPanelProps) {
    if (clusters.length === 0) return null;
    return (
        <PanelCard
            aria-label="Agent clusters"
            className="w-[280px] max-w-full max-h-[55%]"
            count={clusters.length}
            onClose={onClearClusters}
            title={
                <span className="inline-flex items-center gap-2">
                    <span
                        title="Updated each tick"
                        className="inline-flex items-center rounded bg-gradient-to-r from-[hsl(270,70%,55%)] to-[hsl(240,70%,55%)] px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-white"
                    >
                        LIVE
                    </span>
                    Clusters
                </span>
            }
        >
            <ol className="m-0 min-h-0 flex-auto list-none overflow-y-auto p-0">
                {clusters.map((c, idx) => {
                    const isFocused = c.incidentIds.some((id) => focusedIds.has(id));
                    return (
                        <li
                            key={c.id}
                            data-cluster-id={c.id}
                            onClick={() => onFocusCluster(c)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onFocusCluster(c);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                            title={`Focus ${c.incidentIds.length} incidents`}
                            className={`flex cursor-pointer flex-col gap-1.5 border-b border-l-[3px] border-l-transparent border-(--ui-border-low-em) px-3 py-2 transition-colors duration-100 hover:bg-(--ui-surface-1) focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ui-surface-brand-red) ${isFocused ? 'bg-(--ui-surface-1)' : ''}`}
                        >
                            <div className="flex items-center gap-2 text-[11px] text-(--ui-text-med-em)">
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-(--ui-border-low-em) bg-(--ui-surface-1) text-[11px] font-semibold text-(--ui-text-high-em)">
                                    {idx + 1}
                                </span>
                                {c.trend && TREND_BADGE[c.trend] && (
                                    <StatusTag tone={TREND_BADGE[c.trend].tone} accent={TREND_BADGE[c.trend].accent}>
                                        {TREND_BADGE[c.trend].label}
                                    </StatusTag>
                                )}
                            </div>
                            <h4 className="m-0 text-[13px] font-semibold leading-snug text-(--ui-text-high-em)">
                                {c.headline}
                            </h4>
                            {(c.size != null ||
                                c.totalDelaySeconds != null ||
                                c.peakDelaySeconds != null ||
                                c.diameterKm != null) && (
                                <p
                                    aria-label="Evidence"
                                    className="m-0 flex flex-wrap items-center gap-1 text-[11px] leading-snug text-(--ui-text-low-em) [font-variant-numeric:tabular-nums]"
                                >
                                    {c.size != null && (
                                        <span className="font-semibold text-(--ui-text-med-em)">
                                            {c.size} incidents
                                        </span>
                                    )}
                                    {c.totalDelaySeconds != null && c.totalDelaySeconds > 0 && (
                                        <>
                                            <span aria-hidden className="text-(--ui-text-low-em)">
                                                ·
                                            </span>
                                            <span className="text-(--ui-text-med-em)">
                                                {formatDelay(c.totalDelaySeconds)} total
                                            </span>
                                        </>
                                    )}
                                    {c.peakDelaySeconds != null && c.peakDelaySeconds > 0 && (
                                        <>
                                            <span aria-hidden className="text-(--ui-text-low-em)">
                                                ·
                                            </span>
                                            <span className="text-(--ui-text-med-em)">
                                                peak {formatDelay(c.peakDelaySeconds)}
                                            </span>
                                        </>
                                    )}
                                    {c.diameterKm != null && (
                                        <>
                                            <span aria-hidden className="text-(--ui-text-low-em)">
                                                ·
                                            </span>
                                            <span>{c.diameterKm.toFixed(1)} km</span>
                                        </>
                                    )}
                                    {c.primaryRoads && c.primaryRoads.length > 0 && (
                                        <>
                                            <span aria-hidden className="text-(--ui-text-low-em)">
                                                ·
                                            </span>
                                            <span className="font-semibold text-(--ui-text-med-em)">
                                                {c.primaryRoads.slice(0, 3).join(' + ')}
                                            </span>
                                        </>
                                    )}
                                </p>
                            )}
                        </li>
                    );
                })}
            </ol>
        </PanelCard>
    );
}
