import { buildGeometryDataRequest } from './requestBuilder';
import { parseGeometryDataResponse } from './responseParser';
import { geometryDataTemplate } from './geometryDataTemplate';

const customize = {
    buildGeometryDataRequest,
    parseGeometryDataResponse,
    geometryDataTemplate,
};
export default customize;
