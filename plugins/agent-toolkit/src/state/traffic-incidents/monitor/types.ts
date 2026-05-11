import type { BBox, TrafficIncident } from '@tomtom-org/maps-sdk/core';

export type MonitoredArea = {
    bbox: BBox;
    capturedAt: number;
    label?: string;
};

export type IncidentSnapshot = {
    takenAt: number;
    incidents: TrafficIncident[];
};

export type PollingStatus = 'idle' | 'running' | 'stopped-error';
