import type { Map, Source, SourceSpecification } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import { TomTomMapSource } from '../TomTomMapSource';

describe('TomTomMapSource tests', () => {
    const testSourceId = 'TEST_SOURCE_ID';
    const testSourceSpec = { source: 'spec' } as unknown as SourceSpecification;
    const testRuntimeSource = { id: testSourceId } as unknown as Source;

    test('Constructor', () => {
        let mapSource = new TomTomMapSource(testSourceId, testSourceSpec);
        expect(mapSource.id).toStrictEqual(testSourceId);
        expect(mapSource.spec).toStrictEqual(testSourceSpec);
        expect(mapSource.runtimeSource).toBeUndefined();

        mapSource = new TomTomMapSource(testSourceId, testSourceSpec, testRuntimeSource);
        expect(mapSource.id).toStrictEqual(testSourceId);
        expect(mapSource.spec).toStrictEqual(testSourceSpec);
        expect(mapSource.runtimeSource).toStrictEqual(testRuntimeSource);
    });

    test('ensureAddedToMap when source not yet in the map', () => {
        const mapSource = new TomTomMapSource(testSourceId, testSourceSpec);
        const mapLibreMock = {
            getSource: vi.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(testRuntimeSource),
            addSource: vi.fn(),
        } as unknown as Map;

        mapSource.ensureAddedToMap(mapLibreMock);
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceId);
        expect(mapLibreMock.addSource).toHaveBeenCalledWith(testSourceId, testSourceSpec);
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceId);
        expect(mapSource.runtimeSource).toStrictEqual(testRuntimeSource);
    });

    test('ensureAddedToMap when source already in the map', () => {
        const mapSource = new TomTomMapSource(testSourceId, testSourceSpec, testRuntimeSource);
        const mapLibreMock = vi.fn() as unknown as Map;

        mapSource.ensureAddedToMap(mapLibreMock);
        expect(mapSource.runtimeSource).toStrictEqual(testRuntimeSource);
        expect(mapLibreMock).not.toHaveBeenCalled();
    });

    test('ensureAddedToMap when source already in the map but not set as runtimeSource', () => {
        const mapSource = new TomTomMapSource(testSourceId, testSourceSpec);
        const mapLibreMock = {
            getSource: vi.fn().mockReturnValue(testRuntimeSource),
            addSource: vi.fn(),
        } as unknown as Map;

        mapSource.ensureAddedToMap(mapLibreMock);
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceId);
        expect(mapLibreMock.addSource).not.toHaveBeenCalled();
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceId);
        expect(mapSource.runtimeSource).toStrictEqual(testRuntimeSource);
    });
});
