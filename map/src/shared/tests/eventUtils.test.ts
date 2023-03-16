import { EventType } from "../types";
import { Feature } from "geojson";
import { putEventState } from "../eventUtils";

describe("updateEventState related tests", () => {
    const testFeature = (id: string | number | undefined, eventState?: EventType): Feature =>
        ({
            id,
            ...(eventState && {
                properties: {
                    eventState
                }
            })
        } as unknown as Feature);

    test("putEventState", () => {
        expect(putEventState("hover", "2", [])).toBeUndefined();

        let featuresToUpdate = [testFeature("2")];
        expect(putEventState("hover", "1", [testFeature("2")])).toBeUndefined();
        expect(featuresToUpdate).toEqual([{ id: "2" }]);

        expect(putEventState("hover", "1", [testFeature(undefined)])).toBeUndefined();

        featuresToUpdate = [testFeature("2"), testFeature("5")];
        expect(putEventState("hover", "2", featuresToUpdate)).toBe(0);
        expect(featuresToUpdate).toEqual([{ id: "2", properties: { eventState: "hover" } }, { id: "5" }]);

        featuresToUpdate = [testFeature("2", "click"), testFeature("5")];
        expect(putEventState("hover", "5", featuresToUpdate)).toBe(1);
        expect(featuresToUpdate).toEqual([
            { id: "2", properties: { eventState: "click" } },
            { id: "5", properties: { eventState: "hover" } }
        ]);

        featuresToUpdate = [testFeature("2", "click"), testFeature("5")];
        expect(putEventState("hover", "5", featuresToUpdate, "removeFromProps")).toBe(1);
        expect(featuresToUpdate).toEqual([
            { id: "2", properties: { eventState: "click" } },
            { id: "5", properties: {} }
        ]);

        // testing event priorities:
        featuresToUpdate = [testFeature("2", "hover"), testFeature("5")];
        expect(putEventState("click", "2", featuresToUpdate)).toBe(0);
        expect(featuresToUpdate).toEqual([{ id: "2", properties: { eventState: "click" } }, { id: "5" }]);

        featuresToUpdate = [testFeature("2", "click"), testFeature("5")];
        expect(putEventState("hover", "2", featuresToUpdate)).toBeUndefined();
        // existing click event state won't change:
        expect(featuresToUpdate).toEqual([{ id: "2", properties: { eventState: "click" } }, { id: "5" }]);

        featuresToUpdate = [testFeature("2", "click"), testFeature("5")];
        // nothing changed (feature event has higher priority):
        expect(putEventState("hover", "2", featuresToUpdate, "removeFromProps")).toBeUndefined();
        expect(featuresToUpdate).toEqual([{ id: "2", properties: { eventState: "click" } }, { id: "5" }]);

        featuresToUpdate = [testFeature("3", "click"), testFeature(50, "long-hover")];
        expect(putEventState("hover", 50, featuresToUpdate, "removeFromProps")).toBe(1);
        expect(featuresToUpdate).toEqual([
            { id: "3", properties: { eventState: "click" } },
            { id: 50, properties: {} }
        ]);

        // removing with high priority event as reference (doesn't need to match any feature):
        featuresToUpdate = [testFeature("A"), testFeature("B", "long-hover")];
        expect(putEventState("click", "B", featuresToUpdate, "removeFromProps")).toBe(1);
        expect(featuresToUpdate).toEqual([{ id: "A" }, { id: "B", properties: {} }]);

        featuresToUpdate = [testFeature("3", "contextmenu"), testFeature(50, "long-hover")];
        expect(putEventState("click", "3", featuresToUpdate)).toBe(0);
        expect(featuresToUpdate).toEqual([
            { id: "3", properties: { eventState: "click" } },
            { id: 50, properties: { eventState: "long-hover" } }
        ]);

        featuresToUpdate = [testFeature("3", "contextmenu"), testFeature(50, "long-hover")];
        expect(putEventState("hover", "3", featuresToUpdate)).toBeUndefined();
        expect(featuresToUpdate).toEqual([
            { id: "3", properties: { eventState: "contextmenu" } },
            { id: 50, properties: { eventState: "long-hover" } }
        ]);

        featuresToUpdate = [testFeature("A", "contextmenu"), testFeature("B", "long-hover")];
        expect(putEventState("hover", "B", featuresToUpdate)).toBe(1);
        expect(featuresToUpdate).toEqual([
            { id: "A", properties: { eventState: "contextmenu" } },
            { id: "B", properties: { eventState: "hover" } }
        ]);
    });
});
