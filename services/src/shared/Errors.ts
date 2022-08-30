import { AxiosError } from "axios";
import { APIErrorCode, APIResponseError } from "./types/APIResponseErrorTypes";
import { Services } from "./types/ServicesTypes";

export class SDKError extends Error {
    status?: number;
    stack?: string;
    readonly __originalError: unknown;

    constructor(readonly error: unknown, readonly service?: Services, message?: string) {
        super((error as Error).message);
        this.__originalError = error;

        if (message) {
            this.message = message;
        }

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

        if (this.status === 400) {
            if (response && response.data.error) {
                this.message = response.data.error;
            }
            return;
        }

        /**
         * Check if there is a status and if the status exists in the mapped API error types
         */
        if (this.status && APIErrorCode[this.status]) {
            this.message = APIErrorCode[this.status];
        }
    }
}
