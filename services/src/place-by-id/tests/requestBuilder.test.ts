import { buildPlaceByIdRequest } from "../requestBuilder";
import placeByIdReqObjects from "./requestBuilderPerf.data.json";
import type { PlaceByIdParams } from "../types";
import { bestExecutionTimeMS } from "core/src/util/tests/performanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "../../shared/tests/perfConfig";

describe("Place by ID request URL building functional tests", () => {
    test("Place by ID request URL building mandatory parameters request", () => {
        expect(
            buildPlaceByIdRequest({
                commonBaseURL: "https://api-test.tomtom.com",
                apiKey: "testKey",
                entityId: "testEntity"
            }).toString()
        ).toStrictEqual(
            "https://api-test.tomtom.com/maps/orbis/places/place.json?key=testKey&apiVersion=1&entityId=testEntity"
        );
    });
    test("Place by ID request URL building optional parameters request", () => {
        expect(
            buildPlaceByIdRequest({
                commonBaseURL: "https://api-test.tomtom.com",
                apiKey: "testKey",
                language: "es-ES",
                entityId: "testEntity",
                mapcodes: ["Local"],
                view: "Unified",
                openingHours: "nextSevenDays",
                timeZone: "iana",
                relatedPois: "off"
            }).toString()
        ).toStrictEqual(
            "https://api-test.tomtom.com/maps/orbis/places/place.json?key=testKey&language=es-ES&apiVersion=1&entityId=testEntity&mapcodes=Local&view=Unified&openingHours=nextSevenDays&timeZone=iana&relatedPois=off"
        );
    });
});

describe("PlaceById request URL performance tests", () => {
    test("PlaceById request URL performance test", () => {
        expect(
            bestExecutionTimeMS(() => buildPlaceByIdRequest(placeByIdReqObjects as PlaceByIdParams), 10)
        ).toBeLessThan(MAX_EXEC_TIMES_MS.placeById.requestBuilding);
    });
});
