import { MapOptions } from "@nav/web-renderer";
import sdkAndRendererInitParams from "./BuildRendererInitParams.data.json";
import { MapInitParams } from "../../types/MapInit";
import { buildRendererInitParams } from "../BuildRendererInitParams";

describe("Renderer init params tests", () => {
    test.each(sdkAndRendererInitParams)(
        `'%s`,
        // @ts-ignore
        (_name: string, mapParams: MapInitParams, rendererOptions: MapOptions) => {
            expect(buildRendererInitParams(mapParams)).toStrictEqual(rendererOptions);
        }
    );
});
