import { MapOptions } from "maplibre-gl";
import sdkAndRendererInitParams from "./BuildMapOptions.data.json";
import { GOSDKMapParams, MapLibreOptions } from "../types/MapInit";
import { buildMapOptions } from "../BuildMapOptions";

describe("Renderer init params tests", () => {
    test.each(sdkAndRendererInitParams)(
        `'%s`,
        // @ts-ignore
        (_name: string, mapLibreOptions: MapLibreOptions, goSDKParams: GOSDKMapParams, rendererOptions: MapOptions) => {
            expect(buildMapOptions(mapLibreOptions, goSDKParams)).toStrictEqual(rendererOptions);
        }
    );
});
