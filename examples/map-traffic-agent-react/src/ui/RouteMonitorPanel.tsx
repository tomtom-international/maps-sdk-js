import { formatDuration } from '@tomtom-org/maps-sdk/core';
import { useEffect, useState } from 'react';
import type { MonitoredRoute } from '../hooks/useRouteMonitor';
import { formatDelay } from '../utils/format';

export type RouteMonitorPanelProps = {
    routes: readonly MonitoredRoute[];
    lastTickAt: number | null;
    onStop: () => void;
};

const formatAge = (ms: number | null): string => {
    if (ms === null) return '—';
    const secs = Math.max(0, Math.floor((Date.now() - ms) / 1000));
    if (secs < 60) return `${secs}s ago`;
    return `${Math.floor(secs / 60)}m ago`;
};

const PANEL_CLASS =
    'flex max-w-full flex-col gap-1.5 rounded-2xl border border-[var(--sdk-border-low,rgba(0,0,0,0.08))] bg-[var(--sdk-surface-0,#fff)] px-3 py-2 text-[12px] leading-[1.2] shadow-[var(--sdk-shadow-e2,0_1px_2px_rgba(0,0,0,0.06))] backdrop-blur-md';

export function RouteMonitorPanel({ routes, lastTickAt, onStop }: RouteMonitorPanelProps) {
    // Tick once a second so the "updated Ns ago" age advances between the
    // monitor's 60s recalculations (same pattern as MonitoredAreaChip).
    const [, setNow] = useState(0);
    useEffect(() => {
        if (routes.length === 0) return;
        const id = setInterval(() => setNow((n) => n + 1), 1000);
        return () => clearInterval(id);
    }, [routes.length]);

    if (routes.length === 0) return null;

    return (
        <div className={PANEL_CLASS} aria-live="polite">
            {routes.map((route) => (
                <RouteRows key={route.entryId} route={route} />
            ))}
            <div className="flex items-center gap-2 opacity-65">
                <span>updated {formatAge(lastTickAt)}</span>
                <button
                    type="button"
                    className="ml-auto cursor-pointer border-0 bg-transparent px-[0.35rem] py-0 font-inherit text-inherit opacity-80 hover:opacity-100"
                    onClick={onStop}
                    aria-label="Stop monitoring routes"
                >
                    Stop
                </button>
            </div>
        </div>
    );
}

function RouteRows({ route }: { route: MonitoredRoute }) {
    // The fastest alternative right now (lowest live travel time) anchors the read.
    const fastestIndex = route.alternatives.reduce(
        (best, alt) =>
            alt.travelTimeInSeconds < (route.alternatives[best]?.travelTimeInSeconds ?? Number.POSITIVE_INFINITY)
                ? alt.index
                : best,
        route.alternatives[0]?.index ?? 0,
    );

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#1ca372]" />
                <span className="font-medium">{route.label}</span>
                <span className="opacity-65">live corridor</span>
            </div>
            {route.alternatives.map((alt) => {
                const isFastest = alt.index === fastestIndex;
                return (
                    <div key={alt.index} className="flex items-center gap-2 pl-4">
                        <span className={isFastest ? 'font-medium' : 'opacity-80'}>
                            {isFastest ? '★ ' : ''}Route {alt.index + 1}
                        </span>
                        <span>{formatDuration(alt.travelTimeInSeconds) ?? '—'}</span>
                        {alt.trafficDelayInSeconds > 0 && (
                            <span className="text-[#c2410c]">{formatDelay(alt.trafficDelayInSeconds)}</span>
                        )}
                        <span className="opacity-65">{Math.round(alt.lengthInMeters / 1000)} km</span>
                    </div>
                );
            })}
        </div>
    );
}
