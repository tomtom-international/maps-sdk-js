import { EventsModule } from "../EventsModule";
import { EventProxy } from "../EventProxy";
import { StyleSourceWithLayers } from "../SourceWithLayers";

const mockedMapModule = { source: { id: "testModule" } } as StyleSourceWithLayers;
const mockConsoleError = jest.spyOn(global.console, "error").mockImplementation();

describe("EventsModule tests", () => {
    const MockEventProxy = {
        addEventHandler: jest.fn(),
        remove: jest.fn()
    } as unknown as EventProxy;

    afterAll(() => {
        mockConsoleError.mockRestore();
    });

    test("Add an event", () => {
        const event = new EventsModule(MockEventProxy, mockedMapModule);
        const callback = jest.fn();

        event.on("click", callback);

        expect(MockEventProxy.addEventHandler).toHaveBeenCalledWith(mockedMapModule, callback, "click");
    });

    test("Add an event without mapModule", () => {
        const event = new EventsModule(MockEventProxy);
        const callback = jest.fn();

        event.on("click", callback);

        expect(console.error).toHaveBeenCalledWith("mapModule can't be undefined.");
    });

    test("Remove an event", () => {
        const event = new EventsModule(MockEventProxy, mockedMapModule);

        event.off("click");

        expect(MockEventProxy.remove).toHaveBeenCalledWith("click", mockedMapModule);
    });

    test("Remove an event without mapModule", () => {
        const event = new EventsModule(MockEventProxy);
        event.off("click");
        expect(console.error).toHaveBeenCalledWith("mapModule can't be undefined.");
    });
});
