import { TomTomMapSource } from '../TomTomMapSource';
import type { Map, Source, SourceSpecification } from 'maplibre-gl';

describe('TomTomMapSource tests', () => {
    const testSourceID = 'TEST_SOURCE_ID';
    const testSourceSpec = { source: 'spec' } as unknown as SourceSpecification;
    const testRuntimeSource = { id: testSourceID } as unknown as Source;

    test('Constructor', () => {
        let mapSource = new TomTomMapSource(testSourceID, testSourceSpec);
        expect(mapSource.id).toStrictEqual(testSourceID);
        expect(mapSource.spec).toStrictEqual(testSourceSpec);
        expect(mapSource.runtimeSource).toBeUndefined();

        mapSource = new TomTomMapSource(testSourceID, testSourceSpec, testRuntimeSource);
        expect(mapSource.id).toStrictEqual(testSourceID);
        expect(mapSource.spec).toStrictEqual(testSourceSpec);
        expect(mapSource.runtimeSource).toStrictEqual(testRuntimeSource);
    });

    test('ensureAddedToMap when source not yet in the map', () => {
        const mapSource = new TomTomMapSource(testSourceID, testSourceSpec);
        const mapLibreMock = {
            getSource: jest.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(testRuntimeSource),
            addSource: jest.fn(),
        } as unknown as Map;

        mapSource.ensureAddedToMap(mapLibreMock);
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceID);
        expect(mapLibreMock.addSource).toHaveBeenCalledWith(testSourceID, testSourceSpec);
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceID);
        expect(mapSource.runtimeSource).toStrictEqual(testRuntimeSource);
    });

    test('ensureAddedToMap when source already in the map', () => {
        const mapSource = new TomTomMapSource(testSourceID, testSourceSpec, testRuntimeSource);
        const mapLibreMock = jest.fn() as unknown as Map;

        mapSource.ensureAddedToMap(mapLibreMock);
        expect(mapSource.runtimeSource).toStrictEqual(testRuntimeSource);
        expect(mapLibreMock).not.toHaveBeenCalled();
    });

    test('ensureAddedToMap when source already in the map but not set as runtimeSource', () => {
        const mapSource = new TomTomMapSource(testSourceID, testSourceSpec);
        const mapLibreMock = {
            getSource: jest.fn().mockReturnValue(testRuntimeSource),
            addSource: jest.fn(),
        } as unknown as Map;

        mapSource.ensureAddedToMap(mapLibreMock);
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceID);
        expect(mapLibreMock.addSource).not.toHaveBeenCalled();
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceID);
        expect(mapSource.runtimeSource).toStrictEqual(testRuntimeSource);
    });
});
