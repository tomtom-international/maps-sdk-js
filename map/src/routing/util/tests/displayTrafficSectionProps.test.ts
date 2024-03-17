import type { TrafficSectionProps } from "@anw/maps-sdk-js/core";
import { toDisplayTrafficSectionProps, trafficSectionToIconID } from "../displayTrafficSectionProps";
import type { DisplayTrafficSectionProps } from "../../types/routeSections";
import toIconIDTestData from "./data/toIconID.data.json";
import toDisplayTrafficSectionPropsData from "./data/toDisplayTrafficSectionProps.data.json";

describe("Traffic section builder tests", () => {
    test.each(toIconIDTestData)(
        "'%s'",
        // @ts-ignore
        (_name: string, sectionProps: TrafficSectionProps, expectedIconID: string) => {
            expect(trafficSectionToIconID(sectionProps)).toStrictEqual(expectedIconID);
        }
    );

    test.each(toDisplayTrafficSectionPropsData)(
        "'%s'",
        // @ts-ignore
        (_name: string, sectionProps: TrafficSectionProps, expectedDisplaySectionProps: DisplayTrafficSectionProps) => {
            expect(toDisplayTrafficSectionProps(sectionProps)).toStrictEqual(expectedDisplaySectionProps);
        }
    );
});
