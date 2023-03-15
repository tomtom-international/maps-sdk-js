import { MapOptions } from "maplibre-gl";
import sdkAndRendererInitParams from "./BuildMapOptions.data.json";
import { MapLibreOptions, TomTomMapParams } from "../types/MapInit";
import { buildMapOptions } from "../BuildMapOptions";

describe("Renderer init params tests", () => {
    test.each(sdkAndRendererInitParams)(
        `'%s`,
        // @ts-ignore
        (
            _name: string,
            mapLibreOptions: MapLibreOptions,
            tomtomMapParams: TomTomMapParams,
            rendererOptions: MapOptions
        ) => {
            expect(buildMapOptions(mapLibreOptions, tomtomMapParams)).toStrictEqual({
                ...rendererOptions,
                transformRequest: expect.any(Function)
            });
        }
    );
});
