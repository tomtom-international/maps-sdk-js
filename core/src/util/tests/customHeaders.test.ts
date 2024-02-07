import { generateTomTomHeaders, TOMTOM_USER_AGENT_SDK_NAME } from "../headers";

describe("CustomHeaders", () => {
    test("Generate custom Tracking-ID", () => {
        const trackingId = "My-Tracking-ID";
        const headers = generateTomTomHeaders({ trackingId });
        expect(headers).toEqual({ "Tracking-ID": trackingId });
    });

    test("Generate custom Tracking-ID and TomTom User Agent", () => {
        const trackingId = "My-Tracking-ID";
        const headers = generateTomTomHeaders({ trackingId, tomtomUserAgent: true });
        expect(headers).toEqual({ "Tracking-ID": trackingId, "TomTom-User-Agent": expect.any(String) });
        expect(headers["TomTom-User-Agent"]).toContain(TOMTOM_USER_AGENT_SDK_NAME);
    });

    test("Throw an error with invalid tracking-id", () => {
        const headers = () => generateTomTomHeaders({ trackingId: "-*-//" });
        expect(headers).toThrow(TypeError);
    });
});
