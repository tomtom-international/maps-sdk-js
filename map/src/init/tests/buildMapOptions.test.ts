import type { MapOptions } from "maplibre-gl";
import sdkAndRendererInitParams from "./buildMapOptions.data.json";
import type { MapLibreOptions, TomTomMapParams } from "../types/mapInit";
import { buildMapOptions } from "../buildMapOptions";

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
            expect(buildMapOptions(mapLibreOptions, tomtomMapParams)).toEqual({
                ...rendererOptions,
                transformRequest: expect.any(Function)
            });
        }
    );
});
