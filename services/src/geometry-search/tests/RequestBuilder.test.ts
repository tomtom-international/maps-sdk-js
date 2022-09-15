import {buildGeometrySearchRequest} from "../RequestBuilder";
import geometrySearchReqObjectsAndURLs from "./RequestBuilder.data.json";
import {GeometrySearchRequest, SearchByGeometryPayloadAPI} from "../types";

describe("Calculate Geometry Search request URL building tests", () => {
    test.each(geometrySearchReqObjectsAndURLs)(
        "'%s'",
        // @ts-ignore
        (name: string, params: GeometrySearchRequest, url: string, requestData: SearchByGeometryPayloadAPI) => {
            expect(buildGeometrySearchRequest(params).url.href).toStrictEqual(url);
            expect(buildGeometrySearchRequest(params).data).toStrictEqual(requestData);
        }
    );
});
