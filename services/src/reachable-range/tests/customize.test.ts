import { customizeService } from "../../../index";

describe("Using customize obj", () => {
    test("reachable range request URL building tests using customize obj", () => {
        expect(
            customizeService.reachableRange.buildReachableRangeRequest({
                apiKey: "GLOBAL_API_KEY",
                commonBaseURL: "https://api.tomtom.com",
                origin: [10.123, 20.567],
                budget: { type: "timeMinutes", value: 30 }
            })
        ).toEqual(
            new URL(
                "https://api.tomtom.com/routing/1/calculateReachableRange/20.567,10.123/json?key=GLOBAL_API_KEY&timeBudgetInSec=1800"
            )
        );
    });
});
