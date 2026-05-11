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
        <section className="cluster-panel" aria-label="Agent clusters">
            <header className="cluster-panel-header">
                <h3>
                    <span className="cluster-panel-badge" title="Updated each tick">
                        LIVE
                    </span>
                    Clusters
                </h3>
                <span className="cluster-panel-count">{clusters.length}</span>
                <button
                    type="button"
                    className="cluster-panel-clear"
                    onClick={onClearClusters}
                    title="Clear clusters"
                    aria-label="Clear clusters"
                >
                    ×
                </button>
            </header>
            <ol className="cluster-list">
                {clusters.map((c, idx) => {
                    const isFocused = c.incidentIds.some((id) => focusedIds.has(id));
                    return (
                        <li
                            key={c.id}
                            data-cluster-id={c.id}
                            className={`cluster-card ${isFocused ? 'is-focused' : ''}`}
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
                        >
                            <div className="cluster-card-top">
                                <span className="cluster-card-num">{idx + 1}</span>
                            </div>
                            <h4 className="cluster-card-headline">{c.headline}</h4>
                            <p className="cluster-card-body">{c.body}</p>
                            {(c.size != null || c.peakDelaySeconds != null || c.diameterKm != null) && (
                                <p className="cluster-card-evidence" aria-label="Evidence">
                                    {c.size != null && (
                                        <span className="cluster-card-evidence-count">{c.size} incidents</span>
                                    )}
                                    {c.peakDelaySeconds != null && c.peakDelaySeconds > 0 && (
                                        <>
                                            <span className="cluster-card-evidence-sep" aria-hidden>
                                                ·
                                            </span>
                                            <span className="cluster-card-evidence-peak">
                                                peak +{Math.round(c.peakDelaySeconds / 60)} min
                                            </span>
                                        </>
                                    )}
                                    {c.diameterKm != null && (
                                        <>
                                            <span className="cluster-card-evidence-sep" aria-hidden>
                                                ·
                                            </span>
                                            <span className="cluster-card-evidence-diameter">
                                                {c.diameterKm.toFixed(1)} km
                                            </span>
                                        </>
                                    )}
                                    {c.primaryRoads && c.primaryRoads.length > 0 && (
                                        <>
                                            <span className="cluster-card-evidence-sep" aria-hidden>
                                                ·
                                            </span>
                                            <span className="cluster-card-evidence-roads">
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
