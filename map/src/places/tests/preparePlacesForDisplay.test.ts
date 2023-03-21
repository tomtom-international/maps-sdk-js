import { Place, Places } from "@anw/maps-sdk-js/core";
import { Map } from "maplibre-gl";
import {
    addMapIcon,
    getIconIDForPlace,
    getPOILayerCategoryForPlace,
    preparePlacesForDisplay
} from "../preparePlacesForDisplay";

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
            loadImage: jest.fn().mockImplementation((_url: string, callBack: (err?: Error) => void) => {
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
            loadImage: jest.fn().mockImplementation((_url: string, callBack: () => void) => {
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
            loadImage: jest.fn().mockImplementation((_url: string, callBack: (err?: Error, img?: unknown) => void) => {
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
            getPOILayerCategoryForPlace({
                properties: { poi: { classifications: [{ code: "RESTAURANT" }] } }
            } as Place)
        ).toBe("restaurant");
        expect(
            getPOILayerCategoryForPlace({
                properties: { poi: { classifications: [{ code: "CAFE_PUB" }] } }
            } as Place)
        ).toBe("cafe_or_pub");
        expect(
            getPOILayerCategoryForPlace({
                properties: { poi: { classifications: [{ code: "PHARMACY" }] } }
            } as Place)
        ).toBe("pharmacy");
        expect(
            getPOILayerCategoryForPlace({
                properties: { poi: { classifications: [{ code: "HOTEL_MOTEL" }] } }
            } as Place)
        ).toBe("hotel_or_motel");
        expect(getPOILayerCategoryForPlace({ properties: {} } as Place)).toBeUndefined();
    });
});

describe("test prepare places for display", () => {
    const mapLibreMock = jest.fn() as unknown as Map;
    const places: Places = {
        type: "FeatureCollection",
        features: [
            {
                id: "123",
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [0, 0]
                },
                properties: {
                    type: "POI",
                    poi: {
                        name: "test",
                        phone: "+31000099999"
                    },
                    address: {
                        freeformAddress: "address test"
                    }
                }
            }
        ]
    };
    const getPhoneFun = (place: Place) => place.properties.poi?.phone;

    test("prepare places for display with config", () => {
        expect(
            preparePlacesForDisplay(places, mapLibreMock, {
                iconConfig: { iconStyle: "pin" },
                textConfig: {
                    textSize: 5,
                    textField: ["get", "name"],
                    textFont: ["Noto-Medium"]
                },
                extraFeatureProps: {
                    phone: getPhoneFun,
                    staticProp: "Static text"
                }
            })
        ).toStrictEqual({
            type: "FeatureCollection",
            features: [
                {
                    id: "123",
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [0, 0],
                        bbox: undefined
                    },
                    properties: {
                        id: "123",
                        iconID: "default_pin",
                        title: "test",
                        phone: "+31000099999",
                        staticProp: "Static text",
                        type: "POI",
                        poi: {
                            name: "test",
                            phone: "+31000099999"
                        },
                        address: {
                            freeformAddress: "address test"
                        }
                    }
                }
            ]
        });
    });

    test("prepare places for display with function text field config", () => {
        expect(
            preparePlacesForDisplay(places, mapLibreMock, {
                iconConfig: { iconStyle: "poi-like" },
                textConfig: {
                    textSize: 5,
                    textField: (place) => place.properties.poi?.url || "No url found",
                    textFont: ["Noto-Medium"]
                }
            })
        ).toStrictEqual({
            type: "FeatureCollection",
            features: [
                {
                    id: "123",
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [0, 0],
                        bbox: undefined
                    },
                    properties: {
                        id: "123",
                        iconID: "default",
                        title: "No url found",
                        category: undefined,
                        type: "POI",
                        poi: {
                            name: "test",
                            phone: "+31000099999"
                        },
                        address: {
                            freeformAddress: "address test"
                        }
                    }
                }
            ]
        });
    });
});
