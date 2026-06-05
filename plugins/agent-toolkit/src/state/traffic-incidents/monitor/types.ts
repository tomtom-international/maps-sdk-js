/**
 * @module agent-toolkit-state
 */

import type { BBox, TrafficIncident } from '@tomtom-org/maps-sdk/core';

/**
 * The geographic area a {@link TrafficIncidentsEntry} monitor is polling, captured at
 * monitor-start time and replayed on every tick.
 *
 * @group Agent Toolkit
 */
export type MonitoredArea = {
    bbox: BBox;
    capturedAt: number;
    label?: string;
};

/**
 * A fresh batch of incidents from a single monitor tick, with the moment it was sampled.
 * Payload of {@link TrafficIncidentsStateEvents.monitor-tick}.
 *
 * @group Agent Toolkit
 */
export type IncidentSnapshot = {
    takenAt: number;
    incidents: TrafficIncident[];
};

/**
 * Lifecycle state of a per-entry incidents monitor. `stopped-error` indicates the last
 * poll failed and the timer has been cleared — start the monitor again to retry.
 *
 * @group Agent Toolkit
 */
export type PollingStatus = 'idle' | 'running' | 'stopped-error';
