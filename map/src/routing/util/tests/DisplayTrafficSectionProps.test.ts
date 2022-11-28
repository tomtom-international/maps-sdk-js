import { TrafficSectionProps } from "@anw/go-sdk-js/core";
import { toDisplayTrafficSectionProps, trafficSectionToIconID } from "../DisplayTrafficSectionProps";
import { DisplayTrafficSectionProps } from "../../types/RouteSections";
import toIconIDTestData from "./ToIconID.data.json";
import toDisplayTrafficSectionPropsData from "./ToDisplayTrafficSectionProps.data.json";

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
