import { Place } from "@anw/go-sdk-js/core";
import { DataDrivenPropertyValueSpecification, Map } from "maplibre-gl";
import { placesLayerSpec } from "../layers/PlacesLayers";
import poiLayerSpec from "./poiLayerSpec.data.json";
import {
    getCategoryForPlace,
    getIconIDForPlace,
    getPlacesLayerSpec,
    getTextSizeSpec,
    addMapIcon,
    changePlacesLayerSpecs
} from "../preparePlacesForDisplay";

const placesTextSizeSpec = [
    "step",
    ["zoom"],
    ["/", 14, ["log10", ["max", ["length", ["get", "title"]], 30]]],
    10,
    ["/", 16, ["log10", ["max", ["length", ["get", "title"]], 30]]]
];

describe("Get Icon ID for a given Place tests", () => {
    test("Get Icon ID for a given Place", () => {
        expect(getIconIDForPlace({ properties: {} } as Place)).toStrictEqual("default_pin");
        expect(
            getIconIDForPlace({ properties: { poi: { classifications: [{ code: "HOSPITAL" }] } } } as Place)
        ).toStrictEqual("157_pin");
        expect(
            getIconIDForPlace({ properties: { poi: { classifications: [{ code: "UNSUPPORTED" }] } } } as Place)
        ).toStrictEqual("default_pin");
    });

    test("Get Icon ID for a given Place with custom config", () => {
        const mapLibreMock = {
            loadImage: jest.fn(),
            addImage: jest.fn(),
            hasImage: jest.fn().mockReturnValue(false)
        } as unknown as Map;

        expect(
            getIconIDForPlace({ properties: { poi: { classifications: [{ code: "RESTAURANT" }] } } } as Place, {
                iconConfig: { iconStyle: "circle" }
            })
        ).toStrictEqual("231");

        expect(
            getIconIDForPlace({ properties: { poi: { classifications: [{ code: "BEACH" }] } } } as Place, {
                iconConfig: { iconStyle: "poi-like" }
            })
        ).toStrictEqual("243");

        expect(
            getIconIDForPlace(
                { properties: { poi: { classifications: [{ code: "RESTAURANT" }] } } } as Place,
                {
                    iconConfig: { customIcons: [{ iconUrl: "https://test.com", category: "RESTAURANT" }] }
                },
                mapLibreMock
            )
        ).toStrictEqual("restaurant");

        expect(
            getIconIDForPlace({ properties: { poi: { classifications: [{ code: "RESTAURANT" }] } } } as Place, {
                iconConfig: { customIcons: [{ iconUrl: "https://test.com", category: "RESTAURANT" }] }
            })
        ).toStrictEqual("231_pin");

        expect(
            getIconIDForPlace({ properties: { poi: { classifications: [{ code: "CAFE_PUB" }] } } } as Place, {
                iconConfig: { customIcons: [{ iconUrl: "https://test.com", category: "RESTAURANT" }] }
            })
        ).toStrictEqual("320_pin");
    });

    test("Add custom category icon while map load image has an error", () => {
        const mapLibreMock = {
            loadImage: jest.fn().mockImplementation((url: string, callBack: (err?: Error) => void) => {
                callBack(new Error("image not found"));
            }),
            addImage: jest.fn(),
            hasImage: jest.fn().mockReturnValue(false)
        } as unknown as Map;

        expect(() =>
            getIconIDForPlace(
                { properties: { poi: { classifications: [{ code: "RESTAURANT" }] } } } as Place,
                {
                    iconConfig: { customIcons: [{ iconUrl: "https://test.com", category: "RESTAURANT" }] }
                },
                mapLibreMock
            )
        ).toThrow("image not found");
    });
});

describe("Add map icon tests", () => {
    test("Add custom icon while map already has it", () => {
        const mapLibreMock = {
            loadImage: jest.fn().mockImplementation((url: string, callBack: () => void) => {
                callBack();
            }),
            addImage: jest.fn(),
            hasImage: jest.fn().mockReturnValue(true)
        } as unknown as Map;

        jest.spyOn(mapLibreMock, "addImage");
        addMapIcon(mapLibreMock, "RESTAURANT", { iconUrl: "https://test.com", category: "RESTAURANT" });
        expect(mapLibreMock.addImage).toHaveBeenCalledTimes(0);
    });

    test("Add custom icon to map successfully", () => {
        const mapLibreMock = {
            loadImage: jest.fn().mockImplementation((url: string, callBack: (err?: Error, img?: unknown) => void) => {
                callBack(undefined, "img");
            }),
            addImage: jest.fn(),
            hasImage: jest.fn().mockReturnValue(false)
        } as unknown as Map;
        jest.spyOn(mapLibreMock, "addImage");
        expect(() =>
            addMapIcon(mapLibreMock, "RESTAURANT", { iconUrl: "https://test.com", category: "RESTAURANT" })
        ).not.toThrow();
        expect(mapLibreMock.addImage).toHaveBeenCalledTimes(1);
    });
});

describe("Get mapped poi layer category for a place", () => {
    test("Get mapped poi layer category for a place", () => {
        expect(
            getCategoryForPlace({ properties: { poi: { classifications: [{ code: "RESTAURANT" }] } } } as Place)
        ).toStrictEqual("restaurant");
        expect(
            getCategoryForPlace({ properties: { poi: { classifications: [{ code: "CAFE_PUB" }] } } } as Place)
        ).toStrictEqual("cafe_or_pub");
        expect(
            getCategoryForPlace({ properties: { poi: { classifications: [{ code: "PHARMACY" }] } } } as Place)
        ).toStrictEqual("pharmacy");
        expect(
            getCategoryForPlace({ properties: { poi: { classifications: [{ code: "HOTEL_MOTEL" }] } } } as Place)
        ).toStrictEqual("hotel_or_motel");
    });
});

describe("Get places layer spec with circle or pin icon style config", () => {
    test("Get places layer spec no config", () => {
        expect(getPlacesLayerSpec()).toStrictEqual({ ...placesLayerSpec, id: "placesSymbols" });
    });

    test("Get places layer spec with circle icon style config", () => {
        expect(getPlacesLayerSpec({ iconStyle: "circle" })).toStrictEqual({
            ...placesLayerSpec,
            id: "placesSymbols"
        });
    });

    test("Get places layer spec with pin icon style config", () => {
        expect(getPlacesLayerSpec({ iconStyle: "pin" })).toStrictEqual({
            ...placesLayerSpec,
            id: "placesSymbols"
        });
    });
});

describe("Get places layer spec with poi-like icon style config", () => {
    const mapLibreMock = {
        getStyle: jest.fn().mockReturnValue({ layers: [poiLayerSpec] })
    } as unknown as Map;

    test("Get places layer spec with poi-like icon style config", () => {
        expect(getPlacesLayerSpec({ iconStyle: "poi-like" }, mapLibreMock)).toStrictEqual({
            id: "placesSymbols",
            type: "symbol",
            paint: { ...poiLayerSpec.paint },
            layout: {
                ...poiLayerSpec.layout,
                "text-field": ["get", "title"],
                "icon-image": ["get", "iconID"],
                "text-size": placesTextSizeSpec
            }
        });
    });
});

describe("Change places layer spec", () => {
    const mapLibreMock = {
        getStyle: jest.fn().mockReturnValue({ layers: [poiLayerSpec] }),
        setLayoutProperty: jest.fn(),
        setPaintProperty: jest.fn()
    } as unknown as Map;

    test("Change places layer spec with poi-like icon style config", () => {
        jest.spyOn(mapLibreMock, "setLayoutProperty");
        changePlacesLayerSpecs({ iconStyle: "poi-like" }, mapLibreMock);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(9);
        expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(3);
    });
});

describe("Get places text size specs from poi layer", () => {
    test("Get places text size specs from poi layer", () => {
        expect(
            getTextSizeSpec(poiLayerSpec.layout["text-size"] as DataDrivenPropertyValueSpecification<number>)
        ).toStrictEqual(placesTextSizeSpec);
    });
});
