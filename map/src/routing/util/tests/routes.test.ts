import { DistanceUnitsType, Routes } from "@anw/maps-sdk-js/core";
import { buildDisplayRoutes, buildDisplayRouteSummaries } from "../routes";
import displayRouteSummariesData from "./data/displayRouteSummaries.data.json";
import { DisplayRouteProps, DisplayRouteSummaries } from "../../types/displayRoutes";

describe("Tests to test building display routes", () => {
    test("Build display routes", () => {
        expect(buildDisplayRoutes({ features: [{ properties: {} }] } as Routes)).toEqual({
            features: [{ properties: { routeStyle: "selected" } }]
        });
        expect(buildDisplayRoutes({ features: [{ properties: {} }, { properties: {} }] } as Routes)).toEqual({
            features: [{ properties: { routeStyle: "selected" } }, { properties: { routeStyle: "deselected" } }]
        });
    });

    test.each(displayRouteSummariesData)(
        `'%s`,
        // @ts-ignore
        (
            _name: string,
            displayRoutes: Routes<DisplayRouteProps>,
            unitsType: DistanceUnitsType,
            expectedSummaries: DisplayRouteSummaries
        ) => expect(buildDisplayRouteSummaries(displayRoutes, unitsType)).toEqual(expectedSummaries)
    );
});
