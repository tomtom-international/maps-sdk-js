// TODO: restore SDK reachable range service

// import { PolygonFeatures, TomTomConfig } from "@cet/maps-sdk-js/core";
// import { GeometriesModule, PlacesModule, TomTomMap } from "@cet/maps-sdk-js/map";
// import { calculateReachableRanges, ReachableRangeBudget, search } from "@cet/maps-sdk-js/services";
// import { LngLatBoundsLike } from "maplibre-gl";
// import './style.css';
//
// // (Set your own API key when working in your own environment)
// TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });
//
// const mapReachableRangesInit = async () => {
//     const locations = await search({ query: "", poiCategories: ["AIRPORT"], countries: ["NL"], limit: 25 });
//     const map = new TomTomMap(
//         { container: "map", bounds: locations.bbox as LngLatBoundsLike, fitBoundsOptions: { padding: 100 } },
//         { style: { type: "standard", id: "monoLight" } }
//     );
//
//     const budget: ReachableRangeBudget = { type: "timeMinutes", value: 15 };
//     const reachableRanges: PolygonFeatures = await calculateReachableRanges(
//         locations.features.map((origin) => ({ origin, budget }))
//     );
//     const polygonsModule = await GeometriesModule.get(map, {
//         beforeLayerConfig: "lowestBuilding",
//         lineConfig: { lineWidth: 1, lineColor: "grey" },
//         colorConfig: { fillColor: "#87CEEB", fillOpacity: 0.5 }
//     });
//     polygonsModule.show(reachableRanges);
//
//     const placesModule = await PlacesModule.get(map);
//     placesModule.show(locations);
//
//
// };
//
// window.addEventListener("load", mapReachableRangesInit);
