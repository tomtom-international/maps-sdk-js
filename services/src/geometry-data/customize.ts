import type { GeometryDataTemplate } from './geometryDataTemplate';
import { geometryDataTemplate } from './geometryDataTemplate';
import { buildGeometryDataRequest } from './requestBuilder';
import { parseGeometryDataResponse } from './responseParser';

const customize: {
    buildGeometryDataRequest: typeof buildGeometryDataRequest;
    parseGeometryDataResponse: typeof parseGeometryDataResponse;
    geometryDataTemplate: GeometryDataTemplate;
} = {
    buildGeometryDataRequest,
    parseGeometryDataResponse,
    geometryDataTemplate,
};
export default customize;
