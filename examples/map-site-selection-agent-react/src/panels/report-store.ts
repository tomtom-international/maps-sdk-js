import { useSyncExternalStore } from 'react';

// Holds the latest generated HTML report. generateSiteReport builds the HTML from the results store
// and publishes it here; the ReportPanel offers Open-in-new-tab (user gesture → no popup block) and
// Download. Kept separate from the results store since it's a derived artifact, not an analysis.

export type ReportData = { title: string; html: string };

let current: ReportData | null = null;
const listeners = new Set<() => void>();

export const publishReport = (report: ReportData): void => {
    current = report;
    for (const listener of listeners) listener();
};

const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export const useReport = (): ReportData | null => useSyncExternalStore(subscribe, () => current);
