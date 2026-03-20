// examples/map-data-agent/src/analysis-services.ts
export type ServiceCenter = {
    id: string;
    name: string;
    position: [number, number]; // [longitude, latitude]
};

export class AnalysisServices {
    serviceCenters: ServiceCenter[] = [];
    coverageAnalysisComplete = false;
    coverageSummary = '';

    addServiceCenter(site: ServiceCenter): void {
        this.serviceCenters.push(site);
    }

    setCoverageComplete(summary: string): void {
        this.coverageAnalysisComplete = true;
        this.coverageSummary = summary;
    }

    reset(): void {
        this.serviceCenters = [];
        this.coverageAnalysisComplete = false;
        this.coverageSummary = '';
    }
}
