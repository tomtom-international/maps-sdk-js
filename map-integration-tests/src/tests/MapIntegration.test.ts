import { ConsoleMessage, ElementHandle } from "puppeteer";

/**
 * Map integration tests load a local web server with a web page that has the SDK code available,
 * and then run some e2e programmatic tests on the SDK on that page.
 */
describe("Map Integration tests", () => {
    let mapContainer: ElementHandle;
    let consoleErrors: ConsoleMessage[];

    const trackConsoleErrors = () => {
        consoleErrors = [];
        page.on("console", (message) => {
            message.type() === "error" && consoleErrors.push(message);
        });
    };

    beforeAll(async () => {
        await page.goto("https://localhost:9000");
        // Ensuring the map container is there:
        mapContainer = (await page.$("#map")) as ElementHandle;
        trackConsoleErrors();
    });

    const getCanvasPromise = () => mapContainer.$("canvas");

    test("Successful basic map initialization", async () => {
        await page.evaluate((apiKey) => {
            // @ts-ignore
            new window.SDKMap({
                apiKey,
                style: "satellite",
                center: [10, 50],
                zoom: 3,
                minZoom: 2,
                htmlContainer: document.getElementById("map")
            });
        }, process.env.API_KEY);

        expect(await getCanvasPromise()).not.toBeNull();
        expect(consoleErrors).toHaveLength(0);
    });
});
