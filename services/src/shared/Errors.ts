import { AxiosError } from "axios";
import { APIErrorCode, APIResponseError } from "./types/APIResponseErrorTypes";
import { Services } from "./types/ServicesTypes";

/**
 * Main Error Class for the whole SDK to help with error handling.
 * @group Shared
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
        const { response, stack } = this.error as AxiosError<APIResponseError>;

        this.status = response?.status;
        this.stack = stack;

        /* We use as message what returns from API if any, otherwise we have our APIErrorCode as a fallback*/
        if (response?.data?.error) {
            this.message = response.data.error;
            return;
        }

        /*
         * Check if there is a status and if the status exists in the mapped API error types
         */
        if (this.status && APIErrorCode[this.status]) {
            this.message = APIErrorCode[this.status];
        }
    }
}
