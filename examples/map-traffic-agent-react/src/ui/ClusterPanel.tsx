import type { Cluster } from '../agent/types';

export type ClusterPanelProps = {
    clusters: readonly Cluster[];
    focusedIds: ReadonlySet<string>;
    onFocusCluster: (cluster: Cluster) => void;
    onClearClusters: () => void;
};

export function ClusterPanel({ clusters, focusedIds, onFocusCluster, onClearClusters }: ClusterPanelProps) {
    if (clusters.length === 0) return null;
    return (
        <section
            aria-label="Agent clusters"
            className="flex max-h-[55%] shrink-0 flex-col overflow-hidden rounded-(--sdk-radius-10) border border-(--sdk-border-low) bg-(--sdk-surface-0) shadow-(--sdk-shadow-e4) backdrop-blur-md"
        >
            <header className="flex shrink-0 items-center gap-2 border-b border-(--sdk-border-low) bg-gradient-to-r from-[hsla(270,70%,60%,0.12)] to-[hsla(200,70%,55%,0.06)] px-3 py-2">
                <h3 className="m-0 inline-flex flex-auto items-center gap-2 text-sm font-semibold text-(--sdk-text-high)">
                    <span
                        title="Updated each tick"
                        className="inline-flex items-center rounded bg-gradient-to-r from-[hsl(270,70%,55%)] to-[hsl(240,70%,55%)] px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-white"
                    >
                        LIVE
                    </span>
                    Clusters
                </h3>
                <span className="rounded-full border border-(--sdk-border-low) bg-(--sdk-surface-1) px-2 py-0.5 text-[11px] font-semibold text-(--sdk-text-medium)">
                    {clusters.length}
                </span>
                <button
                    type="button"
                    title="Clear clusters"
                    aria-label="Clear clusters"
                    onClick={onClearClusters}
                    className="h-[22px] w-[22px] cursor-pointer rounded border-0 bg-transparent p-0 text-[18px] leading-none text-(--sdk-text-medium) hover:bg-(--sdk-surface-1) hover:text-(--sdk-text-high)"
                >
                    ×
                </button>
            </header>
            <ol className="m-0 flex-auto list-none overflow-y-auto p-0">
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
                            className={`flex cursor-pointer flex-col gap-1.5 border-b border-l-[3px] border-l-transparent border-(--sdk-border-low) px-3 py-2 transition-colors duration-100 hover:bg-(--sdk-surface-1) focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--sdk-primary-color) ${isFocused ? 'bg-(--sdk-surface-1)' : ''}`}
                        >
                            <div className="flex items-center gap-2 text-[11px] text-(--sdk-text-medium)">
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-(--sdk-border-low) bg-(--sdk-surface-1) text-[11px] font-semibold text-(--sdk-text-high)">
                                    {idx + 1}
                                </span>
                            </div>
                            <h4 className="m-0 text-[13px] font-semibold leading-snug text-(--sdk-text-high)">
                                {c.headline}
                            </h4>
                            <p className="m-0 text-[12px] leading-relaxed text-(--sdk-text-medium)">{c.body}</p>
                            {(c.size != null || c.peakDelaySeconds != null || c.diameterKm != null) && (
                                <p
                                    aria-label="Evidence"
                                    className="m-0 flex flex-wrap items-center gap-1 text-[11px] leading-snug text-(--sdk-text-low) [font-variant-numeric:tabular-nums]"
                                >
                                    {c.size != null && (
                                        <span className="font-semibold text-(--sdk-text-medium)">
                                            {c.size} incidents
                                        </span>
                                    )}
                                    {c.peakDelaySeconds != null && c.peakDelaySeconds > 0 && (
                                        <>
                                            <span aria-hidden className="text-(--sdk-text-low)">
                                                ·
                                            </span>
                                            <span className="text-(--sdk-text-medium)">
                                                peak +{Math.round(c.peakDelaySeconds / 60)} min
                                            </span>
                                        </>
                                    )}
                                    {c.diameterKm != null && (
                                        <>
                                            <span aria-hidden className="text-(--sdk-text-low)">
                                                ·
                                            </span>
                                            <span>{c.diameterKm.toFixed(1)} km</span>
                                        </>
                                    )}
                                    {c.primaryRoads && c.primaryRoads.length > 0 && (
                                        <>
                                            <span aria-hidden className="text-(--sdk-text-low)">
                                                ·
                                            </span>
                                            <span className="font-semibold text-(--sdk-text-medium)">
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
        </section>
    );
}
