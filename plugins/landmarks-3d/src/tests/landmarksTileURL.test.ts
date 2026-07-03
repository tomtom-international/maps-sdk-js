import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { afterEach, describe, expect, it } from 'vitest';
import { buildLandmarksTileURL } from '../landmarksTileURL';

describe('buildLandmarksTileURL', () => {
    afterEach(() => {
        TomTomConfig.instance.reset();
    });

    it('builds the Orbis 3D Landmarks tile URL from the global configuration', () => {
        TomTomConfig.instance.put({ apiKey: 'test-key' });
        expect(buildLandmarksTileURL()).toBe(
            'https://api.tomtom.com/maps/orbis/display/3d/landmarks/tile/{z}/{x}/{y}?key=test-key&apiVersion=2',
        );

        TomTomConfig.instance.put({ apiKey: 'test-key', commonBaseURL: 'https://proxy.example.com' });
        expect(buildLandmarksTileURL()).toBe(
            'https://proxy.example.com/maps/orbis/display/3d/landmarks/tile/{z}/{x}/{y}?key=test-key&apiVersion=2',
        );
    });

    it('omits the key parameter in proxy mode, where the apiKey is empty', () => {
        TomTomConfig.instance.put({ apiKey: '', commonBaseURL: 'https://proxy.example.com' });
        expect(buildLandmarksTileURL()).toBe(
            'https://proxy.example.com/maps/orbis/display/3d/landmarks/tile/{z}/{x}/{y}?apiVersion=2',
        );
    });
});
