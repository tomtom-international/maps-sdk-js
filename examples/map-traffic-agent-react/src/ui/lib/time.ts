/**
 * Ops-vocabulary relative age for a past epoch-ms moment: "just now" (<10s),
 * "Ns ago" (<60s), "Nm ago" (<60m), then "Nh ago". `null` → an em-dash.
 * The shared source for monitor-chip freshness and tracker status lines —
 * one phrasing, computed at render time (callers tick their own re-render).
 */
export function relativeAge(ms: number | null): string {
    if (ms === null) return '—';
    const secs = Math.max(0, Math.floor((Date.now() - ms) / 1000));
    if (secs < 10) return 'just now';
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
}

/** Wall-clock HH:MM for a transition/episode moment (browser-local). */
export const shortClock = (epochMs: number): string =>
    new Date(epochMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * Terse delay label for an AGGREGATE or compact figure: "5m" / "1h 5m". The one source for every
 * grouped/rolled-up delay — the "Delay ∑" KPI cells (area rail, viewport card, pocket chips), a
 * cluster's total and peak, a map-pin badge, a road's summed delay, the tracker live-state line
 * ("N incidents · 5h 5m delay"), and the delay-sparkline footer. Sub-minute values round to "0m".
 *
 * The register rule (pairs with `utils/format.formatDelay`): a SINGLE incident's own delay reads
 * verbosely + self-describing ("+30 min") via `formatDelay`; an aggregate or group statistic (sum,
 * the cluster peak/max, a KPI rollup) reads terse via this — the adjacent label ("Delay ∑", "total",
 * "peak") already names it, so the "+" is dropped.
 */
export function formatDelayTerse(seconds: number): string {
    const mins = Math.round(seconds / 60);
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
}
