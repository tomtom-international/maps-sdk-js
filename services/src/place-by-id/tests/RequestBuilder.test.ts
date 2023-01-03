import { buildPlaceByIdRequest } from "../RequestBuilder";
import placeByIdReqObjects from "./RequestBuilderPerf.data.json";
import { PlaceByIdParams } from "../types";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import perfConfig from "services/perfConfig.json";

describe("Place by ID request URL building functional tests", () => {
    test("Place by ID request URL building mandatory parameters request", () => {
        expect(
            buildPlaceByIdRequest({
                commonBaseURL: "https://api-test.tomtom.com",
                apiKey: "testKey",
                entityId: "testEntity"
            }).toString()
        ).toStrictEqual("https://api-test.tomtom.com/search/2/place.json?key=testKey&entityId=testEntity");
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
            "https://api-test.tomtom.com/search/2/place.json?key=testKey&language=es-ES&entityId=testEntity&mapcodes=Local&view=Unified&openingHours=nextSevenDays&timeZone=iana&relatedPois=off"
        );
    });
});

describe("PlaceById request URL performance tests", () => {
    test("PlaceById request URL performance test", () => {
        expect(
            bestExecutionTimeMS(() => buildPlaceByIdRequest(placeByIdReqObjects as PlaceByIdParams), 10)
        ).toBeLessThan(perfConfig.placeById.requestBuilding);
    });
});
