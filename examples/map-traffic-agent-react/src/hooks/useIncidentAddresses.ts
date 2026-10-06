import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { reverseGeocode } from '@tomtom-org/maps-sdk/services';
import { useEffect, useRef, useState } from 'react';
import {
    createCoordResolver,
    type IncidentAddress,
    incidentEndpoints,
    incidentNeedsAddress,
} from '../utils/incidentLocation';

// Cap new reverse-geocode lookups per refresh so a big corridor doesn't fire a burst of requests.
const MAX_NEW_LOOKUPS = 25;

/**
 * For incidents that have no road number / "from" street to show (common for on-route incidents
 * extracted from a corridor), reverse-geocode their start (and end) points and return a per-incident
 * address. Geocoding + caching + formatting live in `utils/incidentLocation` (unit-tested); this hook
 * is just the React orchestration. The triage panel falls back to these addresses when an incident
 * has no street label.
 */
export function useIncidentAddresses(incidents: readonly TrafficIncident[]): ReadonlyMap<string, IncidentAddress> {
    const [addresses, setAddresses] = useState<Map<string, IncidentAddress>>(new Map());
    // One resolver for the hook's lifetime so its coordinate cache survives ticks/re-renders.
    const resolveRef = useRef(createCoordResolver(reverseGeocode));

    useEffect(() => {
        let cancelled = false;
        const resolve = resolveRef.current;
        const pending = incidents
            .filter((inc) => incidentNeedsAddress(inc) && !addresses.has(inc.properties.id))
            .slice(0, MAX_NEW_LOOKUPS);
        if (pending.length === 0) return;

        void (async () => {
            const resolved: Array<[string, IncidentAddress]> = [];
            for (const inc of pending) {
                const { start, end } = incidentEndpoints(inc.geometry);
                const from = await resolve(start);
                const to = await resolve(end);
                if (cancelled) return;
                if (from || to) resolved.push([inc.properties.id, { from, to }]);
            }
            if (cancelled || resolved.length === 0) return;
            setAddresses((prev) => {
                const next = new Map(prev);
                for (const [id, addr] of resolved) next.set(id, addr);
                return next;
            });
        })();

        return () => {
            cancelled = true;
        };
    }, [incidents]);

    return addresses;
}
