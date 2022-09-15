import {buildGeometrySearchRequest} from "../RequestBuilder";
import geometrySearchReqObjectsAndURLs from "./RequestBuilder.data.json";
import {GeometrySearchRequest, SearchByGeometryPayloadAPI} from "../types";

describe("Calculate Geometry Search request URL building tests", () => {
    test.each(geometrySearchReqObjectsAndURLs)(
        "'%s'",
        // @ts-ignore
        (_name: string, params: GeometrySearchRequest, requestData: SearchByGeometryPayloadAPI) => {
            expect(JSON.stringify(buildGeometrySearchRequest(params))).toStrictEqual(JSON.stringify(requestData));
        }
    );
});
