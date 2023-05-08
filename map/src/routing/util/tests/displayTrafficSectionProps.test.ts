import { TrafficSectionProps } from "@anw/maps-sdk-js/core";
import { toDisplayTrafficSectionProps, trafficSectionToIconID } from "../displayTrafficSectionProps";
import { DisplayTrafficSectionProps } from "../../types/routeSections";
import toIconIDTestData from "./toIconID.data.json";
import toDisplayTrafficSectionPropsData from "./toDisplayTrafficSectionProps.data.json";

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
