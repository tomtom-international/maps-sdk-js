import { validate } from "uuid";
import { generateTomTomCustomHeaders } from "../CustomHeaders";
import { SDK_NAME } from "../CustomHeaders";

describe("CustomHeaders", () => {
    test("Generate default TomTom Headers", () => {
        const headers = generateTomTomCustomHeaders({});

        expect(validate(headers["Tracking-ID"])).toBeTruthy();
        expect(headers["TomTom-User-Agent"]).toContain(SDK_NAME);
    });

    test("Generate custom Tracking-ID", () => {
        const trackingId = "My-Tracking-ID";
        const headers = generateTomTomCustomHeaders({ trackingId });

        expect(headers["Tracking-ID"]).toEqual(trackingId);
        expect(headers["TomTom-User-Agent"]).toContain(SDK_NAME);
    });

    test("Throw an error with invalid tracking-id", () => {
        const headers = () => generateTomTomCustomHeaders({ trackingId: "-*-//" });

        expect(headers).toThrow(TypeError);
    });
});
