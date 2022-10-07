import { StyleSpecification } from "maplibre-gl";
import goSDKInitParamsAndMapStyles from "./MapStyleInputBuilder.data.json";
import { GOSDKMapParams } from "../types/MapInit";
import { buildMapStyleInput } from "../MapStyleInputBuilder";

describe("Map style input builder tests", () => {
    test.each(goSDKInitParamsAndMapStyles)(
        `'%s`,
        // @ts-ignore
        (_name: string, goSDKParams: GOSDKMapParams, rendererStyle: StyleSpecification | string) => {
            expect(buildMapStyleInput(goSDKParams)).toStrictEqual(rendererStyle);
        }
    );
});
