import { SDKError } from "../Errors";

describe("SDKError tests", () => {
    it("should return object when catch an Error instance", async () => {
        let error;
        try {
            throw new Error("Testing");
        } catch (e) {
            error = e;
        } finally {
            const sdkError = new SDKError(error);
            expect(sdkError.message).toEqual("Testing");
            expect(sdkError.service).toEqual(undefined);
            expect(sdkError.stack).not.toBeNull();
        }
    });

    it("should show custom message and service when passed as arguments", async () => {
        let error;
        try {
            throw new Error("Testing");
        } catch (e) {
            error = e;
        } finally {
            const sdkError = new SDKError(error, "Routing", "This is a new message");
            expect(sdkError.message).toEqual("This is a new message");
            expect(sdkError.service).toEqual("Routing");
            expect(sdkError.stack).not.toBeNull();
        }
    });
});
