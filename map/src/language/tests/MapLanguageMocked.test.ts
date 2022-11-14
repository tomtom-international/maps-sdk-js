import { Map } from "maplibre-gl";
import { GOSDKMap } from "../../GOSDKMap";
import { MapLanguage } from "../MapLanguage";
import { layers } from "./localization.data";

describe("MapLanguage module", () => {
    test("setting language when map is ready", () => {
        const goSDKMapMock = {
            mapLibreMap: {
                getStyle: jest.fn().mockImplementation(() => ({ layers: layers.map((layerObj) => layerObj[1]) })),
                setLayoutProperty: jest.fn(),
                isStyleLoaded: jest.fn().mockImplementation(() => true)
            } as unknown as Map
        } as GOSDKMap;
        MapLanguage.setLanguage(goSDKMapMock, { language: "ar" });
        expect(goSDKMapMock.mapLibreMap.getStyle).toHaveBeenCalledTimes(1);
        expect(goSDKMapMock.mapLibreMap.setLayoutProperty).toHaveBeenCalledTimes(4);
        MapLanguage.setLanguage(goSDKMapMock, { language: "" });
        expect(goSDKMapMock.mapLibreMap.getStyle).toHaveBeenCalledTimes(2);
        expect(goSDKMapMock.mapLibreMap.setLayoutProperty).toHaveBeenCalledTimes(8);
    });
});
