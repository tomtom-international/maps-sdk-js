import { StyleSpecification } from "maplibre-gl";
import mapsSDKInitParamsAndMapStyles from "./MapStyleInputBuilder.data.json";
import { TomTomMapParams } from "../types/MapInit";
import { buildMapStyleInput } from "../MapStyleInputBuilder";

describe("Map style input builder tests", () => {
    test.each(mapsSDKInitParamsAndMapStyles)(
        `'%s`,
        // @ts-ignore
        (_name: string, tomtomMapParams: TomTomMapParams, rendererStyle: StyleSpecification | string) => {
            expect(buildMapStyleInput(tomtomMapParams)).toStrictEqual(rendererStyle);
        }
    );
});
