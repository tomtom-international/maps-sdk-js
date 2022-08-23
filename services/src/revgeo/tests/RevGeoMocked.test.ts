import reverseGeocode from "../ReverseGeocoding";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import {
    example0APIResponse,
    example0SDKResponse,
    exampleAPIResponseFromKrEndPoint,
    exampleAPIResponseWithLanguageGeoTypeMapCode,
    exampleAPIResponseWithNumberRoadUseSpeedLimit,
    exampleAPIResponseWithRadius,
    exampleSDKResponseForKrEndPoint,
    exampleSDKResponseWithLanguageGeoTypeMapCode,
    exampleSDKResponseWithNumberRoadUseSpeedLimit,
    exampleSDKResponseWithRadius
} from "./RevGeoTest.data";

describe("Reverse Geocoding mocked tests", () => {
    const axiosMock = new MockAdapter(axios);

    test("Default reverse geocoding", async () => {
        axiosMock.onGet().replyOnce(200, example0APIResponse);
        expect(await reverseGeocode({ position: [5.72884, 52.33499] })).toStrictEqual(example0SDKResponse);
    });

    test("Default reverse geocoding - Korea", async () => {
        axiosMock.onGet().replyOnce(200, exampleAPIResponseFromKrEndPoint);
        expect(
            await reverseGeocode({
                position: [126.97367, 37.57435],
                customServiceBaseURL: "https://api.tomtom.com/search/2/reverseGeocode/"
            })
        ).toStrictEqual(exampleSDKResponseForKrEndPoint);
    });

    test("Reverse geocoding for coordinates in middle of an ocean with a radius of 80Kms", async () => {
        axiosMock.onGet().replyOnce(200, exampleAPIResponseWithRadius);
        expect(await reverseGeocode({ position: [-36.491432, -54.283085], radius: 80000 })).toStrictEqual(
            exampleSDKResponseWithRadius
        );
    });

    test("Localized municipality reverse geocoding with map-codes", async () => {
        axiosMock.onGet().replyOnce(200, exampleAPIResponseWithLanguageGeoTypeMapCode);
        expect(
            await reverseGeocode({
                position: [-3.140351, 55.947106],
                geographyType: ["Municipality"],
                mapcodes: ["International"]
            })
        ).toStrictEqual(exampleSDKResponseWithLanguageGeoTypeMapCode);
    });

    test("Reverse geocoding with house number, return road-use & return speed limit input", async () => {
        axiosMock.onGet().replyOnce(200, exampleAPIResponseWithNumberRoadUseSpeedLimit);
        expect(
            await reverseGeocode({
                position: [5.149537, 52.352848],
                number: "22",
                returnRoadUse: true,
                returnSpeedLimit: true
            })
        ).toStrictEqual(exampleSDKResponseWithNumberRoadUseSpeedLimit);
    });
});
