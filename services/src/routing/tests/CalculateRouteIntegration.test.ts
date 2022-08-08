import { inputSectionTypes, LegSection, Section, Sections, Summary } from "@anw/go-sdk-js/core";
import { putIntegrationTestsAPIKey } from "../../shared/tests/IntegrationTestUtils";
import { calculateRoute } from "../CalculateRoute";

const assertSummaryBasics = (summary: Summary): void => {
    expect(summary).toBeDefined();
    expect(summary.lengthInMeters).toBeDefined();
    expect(summary.travelTimeInSeconds).toBeDefined();
    expect(summary.trafficDelayInSeconds).toBeDefined();
    expect(summary.trafficLengthInMeters).toBeDefined();
    expect(summary.departureTime).toBeDefined();
    expect(summary.arrivalTime).toBeDefined();
};

const assertLegSectionBasics = (section: LegSection): void => {
    expect(section.startPointIndex).toBeDefined();
    expect(section.endPointIndex).toBeDefined();
    assertSummaryBasics(section.summary);
};

const assertSectionBasics = (section: Section): void => {
    expect(section.startPointIndex).toBeDefined();
    expect(section.endPointIndex).toBeDefined();
};

describe("Calculate route integration tests", () => {
    beforeAll(() => putIntegrationTestsAPIKey());

    test("Amsterdam to Leiden to Rotterdam with default options", async () => {
        const result = await calculateRoute({
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
                [4.47059, 51.92291]
            ]
        });
        expect(result.routes?.features?.length).toEqual(1);
        const routeFeature = result.routes.features[0];
        expect(routeFeature.geometry.coordinates.length).toBeGreaterThan(1000);
        const routeProperties = routeFeature.properties;
        assertSummaryBasics(routeProperties.summary);
        const sections = routeProperties.sections;
        expect(sections.leg).toHaveLength(2);
        assertLegSectionBasics(sections.leg[0]);
        assertLegSectionBasics(sections.leg[1]);
        // (this example has an extra "other" travel mode section)
        expect(sections.travelMode?.length).toEqual(2);
        for (const inputSectionType of inputSectionTypes.filter(
            (sectionType) => !["leg", "travelMode"].includes(sectionType)
        )) {
            expect(routeProperties.sections[inputSectionType]).toBeUndefined();
        }
    });

    test("Roses to Olot with mostly custom options", async () => {
        const result = await calculateRoute({
            language: "es-ES",
            locations: [
                [3.1748, 42.26297],
                [2.48819, 42.18211]
            ],
            avoid: ["carpools", "ferries"],
            computeAdditionalTravelTimeFor: "all",
            considerTraffic: false,
            instructionsType: "tagged",
            maxAlternatives: 2,
            routeType: "thrilling",
            sectionTypes: "all",
            thrillingParams: {
                hilliness: "low",
                windingness: "high"
            },
            when: {
                option: "arriveBy",
                date: new Date()
            }
        });
        expect(result.routes?.features?.length).toEqual(3);
        for (const routeFeature of result.routes.features) {
            expect(routeFeature).toBeDefined();
            expect(routeFeature.geometry.coordinates.length).toBeGreaterThan(1000);
            const routeProperties = routeFeature.properties;
            assertSummaryBasics(routeProperties.summary);
            expect(routeProperties.guidance).toBeDefined();
            const sections: Sections = routeProperties.sections;
            expect(sections.leg).toHaveLength(1);
            assertLegSectionBasics(sections.leg[0]);
            for (const sectionArray of Object.values(sections)) {
                for (const section of sectionArray) {
                    assertSectionBasics(section as Section);
                }
            }
        }
    });
});
