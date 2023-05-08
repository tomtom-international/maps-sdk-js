import { StyleSpecification } from "maplibre-gl";
import mapsSDKInitParamsAndMapStyles from "./mapStyleInputBuilder.data.json";
import { TomTomMapParams } from "../types/mapInit";
import { buildMapStyleInput } from "../mapStyleInputBuilder";

describe("Map style input builder tests", () => {
    test.each(mapsSDKInitParamsAndMapStyles)(
        `'%s`,
        // @ts-ignore
        (_name: string, tomtomMapParams: TomTomMapParams, rendererStyle: StyleSpecification | string) => {
            expect(buildMapStyleInput(tomtomMapParams)).toStrictEqual(rendererStyle);
        }
    );
});
