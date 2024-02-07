import errorResponses from "./responseError.data.json";
import { APIErrorResponse } from "../types/apiResponseErrorTypes";
import { parseDefaultResponseError, SDKServiceError } from "../errors";
import { ServiceName } from "../types/servicesTypes";

describe("Default error response parsing tests", () => {
    test.each(errorResponses)(
        "'%s'",
        // @ts-ignore
        (
            _name: string,
            apiResponseError: APIErrorResponse,
            serviceName: ServiceName,
            expectedSDKError: SDKServiceError
        ) => {
            const sdkResponseError = parseDefaultResponseError(apiResponseError, serviceName);
            expect(sdkResponseError).toMatchObject(expectedSDKError);
        }
    );
});
