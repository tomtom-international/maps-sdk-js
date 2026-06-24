/**
 * @module agent-toolkit-tools
 *
 * Worker-side entry that exposes SDK utility namespaces as `self.<group>` globals
 * inside the iframe-worker sandbox. It is **not** part of the published module graph:
 * the `virtual:sandbox-sdk-utils` plugin (see `vite-sandbox-build.ts`) bundles this
 * file at SDK build time into a self-contained IIFE string that is concatenated into
 * the worker source (`sandbox/worker-libs.ts`).
 *
 * Grouped by namespace (`routeUtils`, …) or bare function (`cluster`) so new utility sets can be added
 * here WITHOUT touching the Vite config or the bundling: add a key to `sdkUtils`, inject the matching
 * name in `multi-input.ts` (`MULTI_INPUT_SANDBOX_PARAMS` + `packSandboxArgs`), list it in
 * `WORKER_PROVIDED_PARAMS`, and add it to the `provided` map in `worker-runtime.ts`. `@turf/turf` is
 * externalised to the worker's already-loaded `self.turf`, and the helpers' only other dependencies are
 * pure local SDK code, so the bundle stays small and pulls in no second copy of turf. Keep each key in
 * sync with its main-thread injection in `multi-input.ts` (the SAME sets).
 */
import {
    calculateProgressAtRoutePoint,
    getCoordinateAtRouteProgress,
    getProgressAtNearestRoutePoint,
    getRouteProgressBetween,
    getRouteProgressForSection,
    getSectionBBox,
} from '@tomtom-org/maps-sdk/core';
import { clusterIncidents } from '../../../state/traffic-incidents/clustering';

// One entry per injected name; each key becomes a `self.<key>` global in the worker. Namespaces group
// related helpers (`routeUtils`); bare functions stand alone (`cluster` — the DBSCAN primitive, pure
// over `self.turf` + local code). Add future groups/functions here.
const sdkUtils = {
    routeUtils: {
        calculateProgressAtRoutePoint,
        getCoordinateAtRouteProgress,
        getProgressAtNearestRoutePoint,
        getRouteProgressBetween,
        getRouteProgressForSection,
        getSectionBBox,
    },
    cluster: clusterIncidents,
};

Object.assign(globalThis as unknown as Record<string, unknown>, sdkUtils);
