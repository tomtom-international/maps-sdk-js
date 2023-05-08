import { generateTomTomCustomHeaders, TOMTOM_USER_AGENT_SDK_NAME } from "../customHeaders";

describe("CustomHeaders", () => {
    test("Generate custom Tracking-ID", () => {
        const trackingId = "My-Tracking-ID";
        const headers = generateTomTomCustomHeaders({ trackingId });

        expect(headers["Tracking-ID"]).toEqual(trackingId);
        expect(headers["TomTom-User-Agent"]).toContain(TOMTOM_USER_AGENT_SDK_NAME);
    });

    test("Throw an error with invalid tracking-id", () => {
        const headers = () => generateTomTomCustomHeaders({ trackingId: "-*-//" });

        expect(headers).toThrow(TypeError);
    });
});
