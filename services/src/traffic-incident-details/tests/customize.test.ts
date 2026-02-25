import { describe, expect, test } from 'vitest';
import { customizeService } from '../../../index';

describe('Using customize obj', () => {
    test('trafficIncidentDetails request building via customize obj (bbox GET)', () => {
        const request = customizeService.trafficIncidentDetails.buildTrafficIncidentDetailsRequest({
            apiKey: 'API_KEY',
            apiVersion: 1,
            commonBaseURL: 'https://api.tomtom.com',
            bbox: [4.728, 52.278, 5.08, 52.479],
        });

        expect(request.method).toBe('GET');
        const url = request.url.toString();
        expect(url).toContain('https://api.tomtom.com/maps/orbis/traffic/incidentDetails');
        expect(url).toContain('apiVersion=1');
        expect(url).toContain('key=API_KEY');
        expect(url).toContain('bbox=4.728%2C52.278%2C5.08%2C52.479');
    });

    test('trafficIncidentDetails request building via customize obj (ids POST, >5 ids)', () => {
        const ids = ['id-1', 'id-2', 'id-3', 'id-4', 'id-5', 'id-6'];
        const request = customizeService.trafficIncidentDetails.buildTrafficIncidentDetailsRequest({
            apiKey: 'API_KEY',
            apiVersion: 1,
            commonBaseURL: 'https://api.tomtom.com',
            ids,
        });

        expect(request.method).toBe('POST');
        expect((request as { data: { ids: string[] } }).data).toEqual({ ids });
    });

    test('trafficIncidentDetails template is exposed', () => {
        expect(customizeService.trafficIncidentDetails.trafficIncidentDetailsTemplate).toBeDefined();
        expect(typeof customizeService.trafficIncidentDetails.trafficIncidentDetailsTemplate.buildRequest).toBe(
            'function',
        );
        expect(typeof customizeService.trafficIncidentDetails.trafficIncidentDetailsTemplate.parseResponse).toBe(
            'function',
        );
    });
});
