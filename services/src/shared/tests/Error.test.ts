import { SDKError } from "../Errors";

describe("SDKError tests", () => {
    it("should return object when catch an Error instance", async () => {
        const sdkError = new SDKError(new Error("Testing"));
        expect(sdkError.message).toEqual("Testing");
        expect(sdkError.service).toEqual(undefined);
        expect(sdkError.status).toBe(undefined);
        expect(sdkError.stack).not.toBeNull();
    });

    it("should show custom message and service when passed as arguments", async () => {
        const sdkError = new SDKError(new Error("Testing"), "Routing", "This is a new message");
        expect(sdkError.message).toEqual("This is a new message");
        expect(sdkError.service).toEqual("Routing");
        expect(sdkError.stack).not.toBeNull();
    });
});
