// examples/map-data-agent/src/analysis-services.ts
import { TomTomServiceResponses } from '@tomtom-org/maps-sdk-plugin-ai-agent';

export type ServiceCenter = {
    id: string;
    name: string;
    position: [number, number]; // [longitude, latitude]
};

export class AnalysisServices extends TomTomServiceResponses {
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

    override reset(): void {
        super.reset();
        this.serviceCenters = [];
        this.coverageAnalysisComplete = false;
        this.coverageSummary = '';
    }
}
