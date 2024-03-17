import { EventsModule } from "../EventsModule";
import type { EventsProxy } from "../EventsProxy";
import type { StyleSourceWithLayers } from "../SourceWithLayers";

const mockedMapModule = { source: { id: "testModule" } } as StyleSourceWithLayers;
const mockConsoleError = jest.spyOn(global.console, "error").mockImplementation();

describe("EventsModule tests", () => {
    const MockEventProxy = {
        addEventHandler: jest.fn(),
        remove: jest.fn()
    } as unknown as EventsProxy;

    afterAll(() => {
        mockConsoleError.mockRestore();
    });

    test("Add an event", () => {
        const event = new EventsModule(MockEventProxy, mockedMapModule);
        const callback = jest.fn();

        event.on("click", callback);

        expect(MockEventProxy.addEventHandler).toHaveBeenCalledWith(mockedMapModule, expect.any(Function), "click");
    });

    test("Remove an event", () => {
        const event = new EventsModule(MockEventProxy, mockedMapModule);

        event.off("click");

        expect(MockEventProxy.remove).toHaveBeenCalledWith(mockedMapModule, "click");
    });
});
