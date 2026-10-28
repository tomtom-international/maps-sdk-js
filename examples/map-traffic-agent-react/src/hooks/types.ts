import type { TrafficAreaAnalytics, TrafficIncident } from '@tomtom-org/maps-sdk/core';
import type { TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';

export type AnalyticsState = {
    analytics: TrafficAreaAnalytics;
    module: TrafficAreaAnalyticsModule;
} | null;

// The overlap stack under the click point, plus which one is showing; the panel pages through it.
export type SelectedIncident = {
    incidents: TrafficIncident[];
    index: number;
} | null;

// Focus is per-dataset. The owning datasetId travels with the focus state so
// prev/next navigation and the clear button know which dataset to act on.
export type FocusState = { datasetId: string; ids: string[]; reason?: string } | null;

export type IncidentsSnapshot = {
    label: string;
    items: readonly TrafficIncident[];
};
