import { AxiosError } from "axios";
import { APIErrorCode, APIResponseError, RoutingAPIResponseError } from "./types/APIResponseErrorTypes";
import { Services } from "./types/ServicesTypes";

/**
 * Main Error Class for the whole SDK to help with error handling.
 * @group Shared
 * @category Types
 */
export class SDKError extends Error {
    status?: number;
    stack?: string;
    readonly __originalError: unknown;

    constructor(readonly error: unknown, readonly service?: Services, message?: string) {
        super(message ? message : (error as Error).message);
        this.__originalError = error;

        this.transformErrorForSerialization();
    }

    private transformErrorForSerialization() {
        if (this.error instanceof AxiosError) {
            this.transformAxiosError();
        }
    }

    private transformAxiosError() {
        const { response, stack } = this.error as AxiosError;

        this.status = response?.status;
        this.stack = stack;

        /* A few services returns different error responses, we should be able to transform those responses based on the service */
        if (this.service === "Routing") {
            this.transformRouteAPIError();
        } else {
            this.transformDefaultAPIError();
        }

        /*
         * We use as message what returns from API if any, otherwise we have our APIErrorCode as a fallback
         * Check if there is a status and if the status exists in the mapped API error types
         */
        if (this.status && APIErrorCode[this.status]) {
            this.message = APIErrorCode[this.status];
        }
    }

    private transformDefaultAPIError() {
        const { response } = this.error as AxiosError<APIResponseError>;

        if (response?.data?.error) {
            this.message = response.data.error;
        }
    }

    private transformRouteAPIError() {
        const { response } = this.error as AxiosError<RoutingAPIResponseError>;

        if (response?.data.error.description) {
            this.message = response?.data.error.description;
        }
    }
}
