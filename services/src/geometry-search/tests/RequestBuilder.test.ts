import { buildGeometrySearchRequest } from "../RequestBuilder";
import geometrySearchReqObjectsAndURLs from "./RequestBuilder.data.json";
import { GeometrySearchRequest, SearchByGeometryPayloadAPI } from "../types";

describe("Calculate Geometry Search request URL building tests", () => {
    test.each(geometrySearchReqObjectsAndURLs)(
        "'%s'",
        // @ts-ignore
        (_name: string, params: GeometrySearchRequest, requestData: SearchByGeometryPayloadAPI) => {
            // (We use JSON.stringify because of the relation between JSON inputs and Date objects)
            // (We reparse the objects to compare them ignoring the order of properties)
            expect(JSON.parse(JSON.stringify(buildGeometrySearchRequest(params)))).toStrictEqual(
                JSON.parse(JSON.stringify(requestData))
            );
        }
    );
});
