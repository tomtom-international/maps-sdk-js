import { requestObjectsAndURLs } from "./RequestBuilder.data";
import { CalculateRouteParams } from "../types/CalculateRouteParams";
import { buildCalculateRouteRequest } from "../RequestBuilder";

describe("Calculate Route request URL building tests", () => {
    // @ts-ignore
    test.each(requestObjectsAndURLs)("'%s'", (_name: string, params: CalculateRouteParams, url: string) => {
        expect(buildCalculateRouteRequest(params).toString()).toStrictEqual(url);
    });
});
