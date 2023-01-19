import { GOSDKMap } from "../../GOSDKMap";
import { waitUntilMapIsReady } from "../mapUtils";

const getGOSDKMapMock = async (flag: boolean) =>
    ({
        mapReady: flag,
        mapLibreMap: {
            once: jest.fn((_, callback) => callback()),
            isStyleLoaded: jest.fn().mockReturnValue(flag)
        },
        _eventsProxy: {
            add: jest.fn()
        }
    } as unknown as GOSDKMap);

describe("Map utils", () => {
    test("waitUntilMapIsReady resolve promise when mapReady or maplibre.isStyleLoaded are true", async () => {
        const goSDKMapMock = await getGOSDKMapMock(true);
        await expect(waitUntilMapIsReady(goSDKMapMock)).resolves.toBeTruthy();
    });

    test('waitUntilMapIsReady resolve promise from mapLibre event once("styledata")', async () => {
        const goSDKMapMock = await getGOSDKMapMock(false);
        await expect(waitUntilMapIsReady(goSDKMapMock)).resolves.toBeTruthy();
    });
});
