import type { RoutingModuleConfig } from '@tomtom-org/maps-sdk/map';
import { useEffect, useRef } from 'react';
import type { AgentInstance } from './useAgentBootstrap';

/**
 * Faint, outlined styling for monitored corridors. Recolours the route + outline
 * to a translucent white-on-dark hint (keeping the SDK's default widths and, crucially,
 * its on-route incident section layers — jam/cause symbols + dashed lines), so the
 * corridor reads as a low-key backdrop and the incidents along it stay prominent.
 * `theme.mainColor` is left unset so it doesn't fight these per-layer overrides.
 */
const CORRIDOR_ROUTE_CONFIG: RoutingModuleConfig = {
    theme: { routeWidth: 's' },
    // A monitored corridor is a backdrop, not a planned trip — drop the per-route ETA bubbles
    // (top-level flag that showRoutes honours). Waypoint pins are dropped via
    // showEntry({ showWaypoints: false }) below.
    summaryBubbles: { visible: false },
    layers: {
        mainLines: {
            routeLine: { paint: { 'line-color': '#ffffff' } },
            routeOutline: { paint: { 'line-color': '#3F454B' } },
            routeDeselectedLine: { paint: { 'line-color': '#ABAFB3' } },
            routeDeselectedOutline: { paint: { 'line-color': '#3F454B' } },
        },
    },
};

/**
 * Displays the monitored route corridors through each entry's own SDK RoutingModule
 * (rather than a separate overlay): applies the faint corridor styling, then shows the
 * entry so the module renders the outlined route AND its on-route traffic incidents.
 * Re-shows on each tick (the monitor overwrites `entry.data` in place) and hides on stop.
 */
export function useMonitoredRouteDisplay(agent: AgentInstance | undefined) {
    // Entries we've shown, so we can hide them again when their monitor stops.
    const shownRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!agent) return;
        const routing = agent.state.routing;
        let cancelled = false;

        const apply = async () => {
            const monitored = new Set(routing.entries.filter((e) => routing.isMonitored(e.id)).map((e) => e.id));
            for (const id of monitored) {
                try {
                    const module = await routing.getEntryRoutingModule(id);
                    if (cancelled) return;
                    module.applyConfig(CORRIDOR_ROUTE_CONFIG);
                    await routing.showEntry(id, { showWaypoints: false });
                    shownRef.current.add(id);
                } catch {
                    // Entry may have been removed between event and render; ignore.
                }
            }
            for (const id of [...shownRef.current]) {
                if (monitored.has(id)) continue;
                shownRef.current.delete(id);
                try {
                    await routing.hideEntry(id);
                } catch {
                    // Already gone; ignore.
                }
            }
        };

        // Serialise runs so overlapping events (a tick emits entries-change + monitor-tick
        // together) can't interleave two showEntry calls on the same module.
        let chain: Promise<void> = Promise.resolve();
        const schedule = () => {
            chain = chain.then(() => (cancelled ? undefined : apply())).catch(() => undefined);
        };

        const unsubs = [
            routing.events.on('entries-change', schedule),
            routing.events.on('monitor-tick', schedule),
            routing.events.on('monitor-start', schedule),
            routing.events.on('monitor-stop', schedule),
        ];
        schedule();

        return () => {
            cancelled = true;
            for (const unsub of unsubs) unsub();
            for (const id of [...shownRef.current]) {
                void routing.hideEntry(id).catch(() => undefined);
            }
            shownRef.current.clear();
        };
    }, [agent]);
}
