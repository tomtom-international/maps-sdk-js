import { Routes } from "@anw/go-sdk-js/core";
import { buildDisplayRoutes } from "../Routes";

describe("Tests to test building display routes", () => {
    test("Build display routes", () => {
        expect(buildDisplayRoutes({ features: [{ properties: {} }] } as Routes)).toStrictEqual({
            features: [{ properties: { routeStyle: "selected" } }]
        });
        expect(buildDisplayRoutes({ features: [{ properties: {} }, { properties: {} }] } as Routes)).toStrictEqual({
            features: [{ properties: { routeStyle: "selected" } }, { properties: { routeStyle: "deselected" } }]
        });
    });
});
