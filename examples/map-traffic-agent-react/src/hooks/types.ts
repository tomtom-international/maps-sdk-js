import type { TrafficAreaAnalytics, TrafficIncident } from '@tomtom-org/maps-sdk/core';
import type { TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';

export type AnalyticsState = {
    analytics: TrafficAreaAnalytics;
    module: TrafficAreaAnalyticsModule;
} | null;

export type SelectedIncident = {
    incident: TrafficIncident;
    overlapCount: number;
} | null;

// Focus is per-entry. The owning entryId travels with the focus state so
// prev/next navigation and the clear button know which entry to act on.
export type FocusState = { entryId: string; ids: string[]; reason?: string } | null;

export type IncidentsSnapshot = {
    label: string;
    items: readonly TrafficIncident[];
};
