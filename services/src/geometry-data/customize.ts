import { buildGeometryDataRequest } from "./RequestBuilder";
import { parseGeometryDataResponse } from "./ResponseParser";
import { geometryDataTemplate } from "./GeometryDataTemplate";

const customize = {
    buildGeometryDataRequest,
    parseGeometryDataResponse,
    geometryDataTemplate
};
export default customize;
