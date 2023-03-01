import { GOSDKSource } from "../GOSDKSource";
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

        goSDKSource = new GOSDKSource(testSourceID, testSourceSpec, testRuntimeSource);
        expect(goSDKSource.id).toStrictEqual(testSourceID);
        expect(goSDKSource.spec).toStrictEqual(testSourceSpec);
        expect(goSDKSource.runtimeSource).toStrictEqual(testRuntimeSource);
    });

    test("ensureAddedToMap when source not yet in the map", () => {
        const goSDKSource = new GOSDKSource(testSourceID, testSourceSpec);
        const mapLibreMock = {
            getSource: jest.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(testRuntimeSource),
            addSource: jest.fn()
        } as unknown as Map;

        goSDKSource.ensureAddedToMap(mapLibreMock);
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceID);
        expect(mapLibreMock.addSource).toHaveBeenCalledWith(testSourceID, testSourceSpec);
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceID);
        expect(goSDKSource.runtimeSource).toStrictEqual(testRuntimeSource);
    });

    test("ensureAddedToMap when source already in the map", () => {
        const goSDKSource = new GOSDKSource(testSourceID, testSourceSpec, testRuntimeSource);
        const mapLibreMock = jest.fn() as unknown as Map;

        goSDKSource.ensureAddedToMap(mapLibreMock);
        expect(goSDKSource.runtimeSource).toStrictEqual(testRuntimeSource);
        expect(mapLibreMock).not.toHaveBeenCalled();
    });

    test("ensureAddedToMap when source already in the map but not set as runtimeSource", () => {
        const goSDKSource = new GOSDKSource(testSourceID, testSourceSpec);
        const mapLibreMock = {
            getSource: jest.fn().mockReturnValue(testRuntimeSource),
            addSource: jest.fn()
        } as unknown as Map;

        goSDKSource.ensureAddedToMap(mapLibreMock);
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceID);
        expect(mapLibreMock.addSource).not.toHaveBeenCalled();
        expect(mapLibreMock.getSource).toHaveBeenCalledWith(testSourceID);
        expect(goSDKSource.runtimeSource).toStrictEqual(testRuntimeSource);
    });
});
