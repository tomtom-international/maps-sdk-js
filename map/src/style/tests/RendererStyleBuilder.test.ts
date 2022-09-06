import mapInitParamsAndRendererStyles from "./RendererStyleBuilder.data.json";
import { MapInitParams } from "../../types/MapInit";
import { buildRendererStyle } from "../RendererStyleBuilder";

describe("Renderer style builder tests", () => {
    test.each(mapInitParamsAndRendererStyles)(
        `'%s`,
        // @ts-ignore
        (_name: string, mapParams: MapInitParams, rendererStyle: string | Record<string, unknown>) => {
            expect(buildRendererStyle(mapParams)).toStrictEqual(rendererStyle);
        }
    );
});
