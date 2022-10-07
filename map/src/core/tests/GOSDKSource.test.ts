import { GOSDKSource, goSDKSourceFromRuntime, goSDKSourceFromSpec } from "../GOSDKSource";
import { Map, Source, SourceSpecification } from "maplibre-gl";

describe("GOSDKSource tests", () => {
    const testSourceID = "TEST_SOURCE_ID";
    const testSourceSpec = { source: "spec" } as unknown as SourceSpecification;
    const testRuntimeSource = { id: testSourceID } as unknown as Source;

    test("Constructor", () => {
        let goSDKSource = new GOSDKSource(testSourceID, testSourceSpec);
        expect(goSDKSource.id).toStrictEqual(testSourceID);
        expect(goSDKSource.spec).toStrictEqual(testSourceSpec);
        expect(goSDKSource.runtimeSource).toBeUndefined();

        goSDKSource = new GOSDKSource(testSourceID, null, testRuntimeSource);
        expect(goSDKSource.id).toStrictEqual(testSourceID);
        expect(goSDKSource.spec).toBeNull();
        expect(goSDKSource.runtimeSource).toStrictEqual(testRuntimeSource);
    });

    test("Constructor functions", () => {
        let goSDKSource = goSDKSourceFromSpec(testSourceID, testSourceSpec);
        expect(goSDKSource.id).toStrictEqual(testSourceID);
        expect(goSDKSource.spec).toStrictEqual(testSourceSpec);
        expect(goSDKSource.runtimeSource).toBeUndefined();

        goSDKSource = goSDKSourceFromRuntime(testRuntimeSource);
        expect(goSDKSource.id).toStrictEqual(testSourceID);
        expect(goSDKSource.spec).toBeNull();
        expect(goSDKSource.runtimeSource).toStrictEqual(testRuntimeSource);
    });

    test("ensureAddedToMap when source not yet in the map", () => {
        const goSDKSource = goSDKSourceFromSpec(testSourceID, testSourceSpec);
        const mapLibreMock = {
            getSource: jest
                .fn()
                .mockImplementationOnce(() => undefined)
                .mockImplementationOnce(() => testRuntimeSource),
            addSource: jest.fn()
        } as unknown as Map;

        goSDKSource.ensureAddedToMap(mapLibreMock);
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceID);
        expect(mapLibreMock.addSource).toHaveBeenCalledWith(testSourceID, testSourceSpec);
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceID);
        expect(goSDKSource.runtimeSource).toStrictEqual(testRuntimeSource);
    });

    test("ensureAddedToMap when source already in the map", () => {
        const goSDKSource = goSDKSourceFromSpec(testSourceID, testSourceSpec);
        const mapLibreMock = {
            getSource: jest.fn().mockImplementation(() => testRuntimeSource),
            addSource: jest.fn()
        } as unknown as Map;

        goSDKSource.ensureAddedToMap(mapLibreMock);
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceID);
        expect(mapLibreMock.addSource).not.toHaveBeenCalled();
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceID);
        expect(goSDKSource.runtimeSource).toStrictEqual(testRuntimeSource);
    });
});
