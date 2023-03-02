// import { Place, Places } from "@anw/go-sdk-js/core";
// import { DataDrivenPropertyValueSpecification, Map } from "maplibre-gl";
// import { placesLayerSpec } from "../layers/PlacesLayers";
// import poiLayerSpec from "./poiLayerSpec.data.json";
// import {
//     getPOILayerCategoryForPlace,
//     getIconIDForPlace,
//     buildPlacesLayerSpec,
//     getTextSizeSpec,
//     addMapIcon,
//     changeLayoutAndPaintProps,
//     preparePlacesForDisplay
// } from "../preparePlacesForDisplay";
//
// const placesTextSizeSpec = [
//     "step",
//     ["zoom"],
//     ["/", 14, ["log10", ["max", ["length", ["get", "title"]], 30]]],
//     10,
//     ["/", 16, ["log10", ["max", ["length", ["get", "title"]], 30]]]
// ];
//
// describe("Get Icon ID for a given Place tests", () => {
//     test("Get Icon ID for a given Place", () => {
//         expect(getIconIDForPlace({ properties: {} } as Place)).toStrictEqual("default_pin");
//         expect(
//             getIconIDForPlace({ properties: { poi: { classifications: [{ code: "HOSPITAL" }] } } } as Place)
//         ).toStrictEqual("157_pin");
//         expect(
//             getIconIDForPlace({ properties: { poi: { classifications: [{ code: "UNSUPPORTED" }] } } } as Place)
//         ).toStrictEqual("default_pin");
//     });
//
//     test("Get Icon ID for a given Place with custom config", () => {
//         const mapLibreMock = {
//             loadImage: jest.fn(),
//             addImage: jest.fn(),
//             hasImage: jest.fn().mockReturnValue(false)
//         } as unknown as Map;
//
//         expect(
//             getIconIDForPlace({ properties: { poi: { classifications: [{ code: "RESTAURANT" }] } } } as Place, {
//                 iconConfig: { iconStyle: "circle" }
//             })
//         ).toStrictEqual("231");
//
//         expect(
//             getIconIDForPlace({ properties: { poi: { classifications: [{ code: "BEACH" }] } } } as Place, {
//                 iconConfig: { iconStyle: "poi-like" }
//             })
//         ).toStrictEqual("243");
//
//         expect(
//             getIconIDForPlace(
//                 { properties: { poi: { classifications: [{ code: "RESTAURANT" }] } } } as Place,
//                 {
//                     iconConfig: { customIcons: [{ iconUrl: "https://test.com", category: "RESTAURANT" }] }
//                 },
//                 mapLibreMock
//             )
//         ).toStrictEqual("restaurant");
//
//         expect(
//             getIconIDForPlace({ properties: { poi: { classifications: [{ code: "RESTAURANT" }] } } } as Place, {
//                 iconConfig: { customIcons: [{ iconUrl: "https://test.com", category: "RESTAURANT" }] }
//             })
//         ).toStrictEqual("231_pin");
//
//         expect(
//             getIconIDForPlace({ properties: { poi: { classifications: [{ code: "CAFE_PUB" }] } } } as Place, {
//                 iconConfig: { customIcons: [{ iconUrl: "https://test.com", category: "RESTAURANT" }] }
//             })
//         ).toStrictEqual("320_pin");
//     });
//
//     test("Add custom category icon while map load image has an error", () => {
//         const mapLibreMock = {
//             loadImage: jest.fn().mockImplementation((_url: string, callBack: (err?: Error) => void) => {
//                 callBack(new Error("image not found"));
//             }),
//             addImage: jest.fn(),
//             hasImage: jest.fn().mockReturnValue(false)
//         } as unknown as Map;
//
//         expect(() =>
//             getIconIDForPlace(
//                 { properties: { poi: { classifications: [{ code: "RESTAURANT" }] } } } as Place,
//                 {
//                     iconConfig: { customIcons: [{ iconUrl: "https://test.com", category: "RESTAURANT" }] }
//                 },
//                 mapLibreMock
//             )
//         ).toThrow("image not found");
//     });
// });
//
// describe("Add map icon tests", () => {
//     test("Add custom icon while map already has it", () => {
//         const mapLibreMock = {
//             loadImage: jest.fn().mockImplementation((_url: string, callBack: () => void) => {
//                 callBack();
//             }),
//             addImage: jest.fn(),
//             hasImage: jest.fn().mockReturnValue(true)
//         } as unknown as Map;
//
//         jest.spyOn(mapLibreMock, "addImage");
//         addMapIcon(mapLibreMock, "RESTAURANT", { iconUrl: "https://test.com", category: "RESTAURANT" });
//         expect(mapLibreMock.addImage).toHaveBeenCalledTimes(0);
//     });
//
//     test("Add custom icon to map successfully", () => {
//         const mapLibreMock = {
//             loadImage: jest.fn().mockImplementation((_url: string, callBack: (err?: Error, img?: unknown) => void) => {
//                 callBack(undefined, "img");
//             }),
//             addImage: jest.fn(),
//             hasImage: jest.fn().mockReturnValue(false)
//         } as unknown as Map;
//         jest.spyOn(mapLibreMock, "addImage");
//         expect(() =>
//             addMapIcon(mapLibreMock, "RESTAURANT", { iconUrl: "https://test.com", category: "RESTAURANT" })
//         ).not.toThrow();
//         expect(mapLibreMock.addImage).toHaveBeenCalledTimes(1);
//     });
// });
//
// describe("Get mapped poi layer category for a place", () => {
//     test("Get mapped poi layer category for a place", () => {
//         expect(
//             getPOILayerCategoryForPlace({
//                 properties: { poi: { classifications: [{ code: "RESTAURANT" }] } }
//             } as Place)
//         ).toBe("restaurant");
//         expect(
//             getPOILayerCategoryForPlace({
//                 properties: { poi: { classifications: [{ code: "CAFE_PUB" }] } }
//             } as Place)
//         ).toBe("cafe_or_pub");
//         expect(
//             getPOILayerCategoryForPlace({
//                 properties: { poi: { classifications: [{ code: "PHARMACY" }] } }
//             } as Place)
//         ).toBe("pharmacy");
//         expect(
//             getPOILayerCategoryForPlace({
//                 properties: { poi: { classifications: [{ code: "HOTEL_MOTEL" }] } }
//             } as Place)
//         ).toBe("hotel_or_motel");
//         expect(getPOILayerCategoryForPlace({ properties: {} } as Place)).toBeUndefined();
//     });
// });
//
// describe("Get places layer spec with circle or pin icon style config", () => {
//     const mapLibreMock = jest.fn() as unknown as Map;
//
//     test("Get places layer spec no config", () => {
//         expect(buildPlacesLayerSpec(undefined, "2", mapLibreMock)).toEqual({
//             ...placesLayerSpec,
//             id: "placesSymbols-2"
//         });
//     });
//
//     test("Get places layer spec with circle icon style config", () => {
//         expect(buildPlacesLayerSpec({ iconConfig: { iconStyle: "circle" } }, "foo", mapLibreMock)).toEqual({
//             ...placesLayerSpec,
//             id: "placesSymbols-foo"
//         });
//     });
//
//     test("Get places layer spec with pin icon style config", () => {
//         expect(buildPlacesLayerSpec({ iconConfig: { iconStyle: "pin" } }, "0", mapLibreMock)).toEqual({
//             ...placesLayerSpec,
//             id: "placesSymbols-0"
//         });
//     });
//
//     test("Get places layer spec with text config", () => {
//         expect(
//             buildPlacesLayerSpec(
//                 {
//                     iconConfig: { iconStyle: "pin" },
//                     textConfig: {
//                         textSize: 5,
//                         textField: ["get", "name"],
//                         textFont: ["Noto-Medium"],
//                         textOffset: [0, 1],
//                         textColor: "red",
//                         textHaloColor: "white",
//                         textHaloWidth: 1
//                     }
//                 },
//                 "0",
//                 mapLibreMock
//             )
//         ).toEqual({
//             ...placesLayerSpec,
//             id: "placesSymbols-0",
//             layout: {
//                 ...placesLayerSpec.layout,
//                 "text-size": 5,
//                 "text-font": ["Noto-Medium"],
//                 "text-offset": [0, 1],
//                 "text-field": ["get", "name"]
//             },
//             paint: {
//                 ...placesLayerSpec.paint,
//                 "text-color": "red",
//                 "text-halo-color": "white",
//                 "text-halo-width": 1
//             }
//         });
//     });
//
//     test("Get places layer spec with function test field config", () => {
//         expect(
//             buildPlacesLayerSpec(
//                 {
//                     textConfig: {
//                         textField: (place) => place.properties.poi?.name || "No name found",
//                         textColor: "green"
//                     }
//                 },
//                 "12",
//                 mapLibreMock
//             )
//         ).toStrictEqual({
//             ...placesLayerSpec,
//             id: "placesSymbols-12",
//             paint: {
//                 ...placesLayerSpec.paint,
//                 "text-color": "green"
//             }
//         });
//     });
// });
//
// describe("Get places layer spec with poi-like icon style config", () => {
//     const mapLibreMock = {
//         getStyle: jest.fn().mockReturnValue({ layers: [poiLayerSpec] })
//     } as unknown as Map;
//
//     test("Get places layer spec with poi-like icon style config", () => {
//         expect(buildPlacesLayerSpec({ iconConfig: { iconStyle: "poi-like" } }, "blah", mapLibreMock)).toStrictEqual({
//             id: "placesSymbols-blah",
//             type: "symbol",
//             paint: { ...poiLayerSpec.paint },
//             layout: {
//                 ...poiLayerSpec.layout,
//                 "text-field": ["get", "title"],
//                 "icon-image": ["get", "iconID"],
//                 "text-size": placesTextSizeSpec
//             }
//         });
//     });
// });
//
// test("changeLayoutAndPaintProps", () => {
//     const newMapMock = (): Map =>
//         ({
//             getStyle: jest.fn().mockReturnValue({ layers: [poiLayerSpec] }),
//             setLayoutProperty: jest.fn(),
//             setPaintProperty: jest.fn()
//         } as unknown as Map);
//
//     let mapLibreMock = newMapMock();
//     changeLayoutAndPaintProps({ id: "layerX", layout: { prop0: "value0" } }, { id: "layerX" }, mapLibreMock);
//     expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
//     expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);
//
//     mapLibreMock = newMapMock();
//     changeLayoutAndPaintProps({ id: "layerX", layout: { prop0: "a", prop1: "b" } }, { id: "layerX" }, mapLibreMock);
//     expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(2);
//     expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);
//
//     mapLibreMock = newMapMock();
//     changeLayoutAndPaintProps(
//         { id: "layerX", layout: { prop0: "a", prop1: "b" } },
//         { id: "layerX", layout: { prop0: "old-a" } },
//         mapLibreMock
//     );
//     expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(2);
//     expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);
//     expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith("layerX", "prop0", "a", { validate: false });
//     expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith("layerX", "prop1", "b", { validate: false });
//
//     mapLibreMock = newMapMock();
//     changeLayoutAndPaintProps(
//         { id: "layerX", layout: { prop0: "a", prop1: "b" } },
//         { id: "layerX", layout: { prop5: "old-a" } },
//         mapLibreMock
//     );
//     expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith("layerX", "prop5", undefined, {
//         validate: false
//     });
//     expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(3);
//     expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(0);
//     expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith("layerX", "prop0", "a", { validate: false });
//     expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith("layerX", "prop1", "b", { validate: false });
//
//     mapLibreMock = newMapMock();
//     changeLayoutAndPaintProps(
//         { id: "layerY", layout: { prop0: "value0" }, paint: { propA: "10" } },
//         { id: "layerY", paint: { propC: "20" } },
//         mapLibreMock
//     );
//     expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
//     expect(mapLibreMock.setPaintProperty).toHaveBeenCalledTimes(2);
//     expect(mapLibreMock.setPaintProperty).toHaveBeenCalledWith("layerY", "propC", undefined, {
//         validate: false
//     });
//     expect(mapLibreMock.setPaintProperty).toHaveBeenCalledWith("layerY", "propA", "10", { validate: false });
// });
//
// test("Get places text size specs from poi layer", () => {
//     expect(
//         getTextSizeSpec(poiLayerSpec.layout["text-size"] as DataDrivenPropertyValueSpecification<number>)
//     ).toStrictEqual(placesTextSizeSpec);
// });
//
// describe("test prepare places for display", () => {
//     const mapLibreMock = jest.fn() as unknown as Map;
//     const places: Places = {
//         type: "FeatureCollection",
//         features: [
//             {
//                 id: "123",
//                 type: "Feature",
//                 geometry: {
//                     type: "Point",
//                     coordinates: [0, 0]
//                 },
//                 properties: {
//                     type: "POI",
//                     poi: {
//                         name: "test",
//                         phone: "+31000099999"
//                     },
//                     address: {
//                         freeformAddress: "address test"
//                     }
//                 }
//             }
//         ]
//     };
//     const getPhoneFun = (place: Place) => place.properties.poi?.phone;
//
//     test("prepare places for display with config", () => {
//         expect(
//             preparePlacesForDisplay(places, mapLibreMock, {
//                 iconConfig: { iconStyle: "pin" },
//                 textConfig: {
//                     textSize: 5,
//                     textField: ["get", "name"],
//                     textFont: ["Noto-Medium"]
//                 },
//                 extraFeatureProps: {
//                     phone: getPhoneFun,
//                     staticProp: "Static text"
//                 }
//             })
//         ).toStrictEqual({
//             type: "FeatureCollection",
//             features: [
//                 {
//                     id: "123",
//                     type: "Feature",
//                     geometry: {
//                         type: "Point",
//                         coordinates: [0, 0],
//                         bbox: undefined
//                     },
//                     properties: {
//                         id: "123",
//                         iconID: "default_pin",
//                         title: "test",
//                         phone: "+31000099999",
//                         staticProp: "Static text",
//                         type: "POI",
//                         poi: {
//                             name: "test",
//                             phone: "+31000099999"
//                         },
//                         address: {
//                             freeformAddress: "address test"
//                         }
//                     }
//                 }
//             ]
//         });
//     });
//
//     test("prepare places for display with function text field config", () => {
//         expect(
//             preparePlacesForDisplay(places, mapLibreMock, {
//                 iconConfig: { iconStyle: "poi-like" },
//                 textConfig: {
//                     textSize: 5,
//                     textField: (place) => place.properties.poi?.url || "No url found",
//                     textFont: ["Noto-Medium"]
//                 }
//             })
//         ).toStrictEqual({
//             type: "FeatureCollection",
//             features: [
//                 {
//                     id: "123",
//                     type: "Feature",
//                     geometry: {
//                         type: "Point",
//                         coordinates: [0, 0],
//                         bbox: undefined
//                     },
//                     properties: {
//                         id: "123",
//                         iconID: "default",
//                         title: "No url found",
//                         category: undefined,
//                         type: "POI",
//                         poi: {
//                             name: "test",
//                             phone: "+31000099999"
//                         },
//                         address: {
//                             freeformAddress: "address test"
//                         }
//                     }
//                 }
//             ]
//         });
//     });
// });
