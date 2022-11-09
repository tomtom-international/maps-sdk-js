import { Map } from "maplibre-gl";
import { GOSDKMap } from "../../GOSDKMap";
import { MapLanguage } from "../MapLanguage";
import { layers } from "../../utils/tests/localization.data";

describe("MapLanguage module", () => {
    test("localize map when ready", () => {
        const goSDKMapMock = {
            mapLibreMap: {
                getStyle: jest.fn().mockImplementation(() => ({ layers: layers.map((layerObj) => layerObj[1]) })),
                setLayoutProperty: jest.fn(),
                isStyleLoaded: jest.fn().mockImplementation(() => true)
            } as unknown as Map
        } as GOSDKMap;
        MapLanguage.localizeMapWhenReady(goSDKMapMock, { language: "ar" });
        expect(goSDKMapMock.mapLibreMap.getStyle).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.setLayoutProperty).toHaveBeenCalledTimes(4);
    });
});
