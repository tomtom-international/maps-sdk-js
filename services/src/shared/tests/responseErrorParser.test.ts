import errorResponses from "./responseError.data.json";
import { DefaultAPIResponseError, ErrorObjAPI } from "../types/apiResponseErrorTypes";
import { parseDefaultResponseError, SDKServiceError } from "../errors";
import { ServiceName } from "../types/servicesTypes";

describe("Default error response parsing tests", () => {
    test.each(errorResponses)(
        "'%s'",
        // @ts-ignore
        (
            _name: string,
            apiResponseError: ErrorObjAPI<DefaultAPIResponseError>,
            serviceName: ServiceName,
            expectedSDKError: SDKServiceError
        ) => {
            const sdkResponseError = parseDefaultResponseError(apiResponseError, serviceName);
            expect(sdkResponseError).toMatchObject(expectedSDKError);
        }
    );
});
