import { buildPlaceByIdRequest } from "../RequestBuilder";

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
