import type { EvalLoadedReport } from '../../src/eval/report';

export type ExplorerManifest = {
    reports: EvalLoadedReport[];
};

export type ExplorerFilterState = {
    search: string;
    belowThresholdOnly: boolean;
    regressionsOnly: boolean;
    improvementsOnly: boolean;
    missingOnly: boolean;
};

export type ReportLoadError = {
    id: string;
    source: string;
    message: string;
};
