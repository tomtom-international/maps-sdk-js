import { geometryDataTemplate } from './geometryDataTemplate';
import { buildGeometryDataRequest } from './requestBuilder';
import { parseGeometryDataResponse } from './responseParser';

const customize = {
    buildGeometryDataRequest,
    parseGeometryDataResponse,
    geometryDataTemplate,
};
export default customize;
