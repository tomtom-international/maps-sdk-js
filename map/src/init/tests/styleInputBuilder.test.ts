import { StyleSpecification } from "maplibre-gl";
import mapsSDKInitParamsAndMapStyles from "./styleInputBuilder.data.json";
import { TomTomMapParams } from "../types/mapInit";
import { buildStyleInput, withPreviousStyleParts } from "../styleInputBuilder";

describe("Map style input builder tests", () => {
    test.each(mapsSDKInitParamsAndMapStyles)(
        `'%s`,
        // @ts-ignore
        (_name: string, tomtomMapParams: TomTomMapParams, rendererStyle: StyleSpecification | string) => {
            expect(buildStyleInput(tomtomMapParams)).toStrictEqual(rendererStyle);
        }
    );

    test("With previous style parts test", () => {
        expect(withPreviousStyleParts("standardDark")).toBe("standardDark");
        expect(withPreviousStyleParts("standardDark", "monoLight")).toBe("standardDark");
        expect(withPreviousStyleParts("standardDark", { type: "published", id: "monoLight" })).toBe("standardDark");
        expect(
            withPreviousStyleParts({ type: "published", id: "standardDark" }, { type: "published", id: "monoLight" })
        ).toEqual({ type: "published", id: "standardDark" });
        expect(
            withPreviousStyleParts(
                { type: "published", id: "standardDark" },
                { type: "published", id: "monoLight", include: ["poi"] }
            )
        ).toEqual({ type: "published", id: "standardDark", include: ["poi"] });
        expect(
            withPreviousStyleParts(
                { type: "published", id: "standardDark", include: ["trafficIncidents"] },
                { type: "published", id: "monoLight", include: ["poi"] }
            )
        ).toEqual({ type: "published", id: "standardDark", include: ["trafficIncidents"] });
    });
});
