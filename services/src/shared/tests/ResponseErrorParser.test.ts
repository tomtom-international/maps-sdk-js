import errorResponses from "./ResponseError.data.json";
import { DefaultAPIResponseError, ErrorObjAPI } from "../types/APIResponseErrorTypes";
import { parseDefaultResponseError, SDKServiceError } from "../Errors";
import { ServiceName } from "../types/ServicesTypes";

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
