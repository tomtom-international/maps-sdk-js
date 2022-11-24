---
title: Planning a route
hideMenu: false
hideSubmenu: false
hasTwoColumns: false
titleTags:
- label: "VERSION 0.0.1"
  color: "grey5"
- label: "PRIVATE PREVIEW"
  color: "grey5"
---

# Requesting routes

To calculate a route from A to B, you need to first provide route planning criteria. These are built using a [`CalculateRouteParams`](/web/maps/documentation/api-reference/modules/services/#calculaterouteparams) object. There are multiple optional parameters that you can use to shape the route planning criteria to fit your use cases. For a detailed description of available parameters, see the [Routing API, Calculate Route documentation](https://developer.tomtom.com/routing-api/documentation/routing/calculate-route).

<Code>

``` typescript
const amsterdam = [4.897070, 52.377956];
const rotterdam = [4.462456, 51.926517];
const routePlanningParams: CalculateRouteParams = {
    locations: [amsterdam, rotterdam],
    routeType: "eco",
    travelMode: "truck",
    maxAlternatives: 2
};
```

``` javascript
const amsterdam = [4.897070, 52.377956];
const rotterdam = [4.462456, 51.926517];
const routePlanningParams = {
    locations: [amsterdam, rotterdam],
    routeType: "eco",
    travelMode: "truck",
    maxAlternatives: 2
};
```

</Code>

Once you've instantiated your [`CalculateRouteParams`](/web/maps/documentation/api-reference/modules/services/#calculaterouteparams), pass it to the [`calculateRoute`](/web/maps/documentation/api-reference/modules/services/#calculateroute) function. The result will be a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[`CalculateRouteResponse`](/web/maps/documentation/api-reference/modules/services/#calculaterouteresponse)>

``` javascript
try {
    const routeResponse = await calculateRoute(routePlanningParams);
    // handle success
} catch (e) {
    // handle error
}
```

# Adjusting route planning criteria

## Route types

The [`RouteOptionalParams.routeType`](/web/maps/documentation/api-reference/modules/services/#routeoptionalparams) parameter specifies the type of optimization used when calculating routes:

-   [`fastest`] - Route calculation is optimized by travel time, while keeping the routes sensible. For example, the calculation may avoid shortcuts along inconvenient side roads or long detours that only save very little time.
-   [`shortest`] - Route calculation is optimized by travel distance, while keeping the routes sensible. For example, straight routes are preferred over those incurring turns.
-   [`short`] - Route calculation is optimized so that a good compromise between small travel time and short travel distance is achieved.
-   [`eco`] - Route calculation is optimized by fuel/energy consumption.
-   [`thrilling`] - Route calculation is optimized so that routes include interesting or challenging roads and use as few motorways as possible.
  -   You can choose the level of turns included and also the degree of hilliness. See the [`ThrillingParams`](/web/maps/documentation/api-reference/modules/services/#thrillingparams) to set this.
  -   There is a limit of 900km on routes planned with [`routeType=thrilling`].

The default value is [`fastest`].

## Avoids

The [`RouteOptionalParams.avoidable`](/web/maps/documentation/api-reference/modules/services/#routeoptionalparams) parameter specifies something that the route calculation should try to avoid when determining the route. The avoid can be specified multiple times. Possible values are:

-   [`tollRoads`](/web/maps/documentation/api-reference/modules/core/#avoidable) - Avoids toll roads.
-   [`motorways`](/web/maps/documentation/api-reference/modules/core/#avoidable) - Avoids motorways.
-   [`ferries`](/web/maps/documentation/api-reference/modules/core/#avoidable) - Avoids ferries.
-   [`unpavedRoads`](/web/maps/documentation/api-reference/modules/core/#avoidable) - Avoids unpaved roads.
-   [`carpools`](/web/maps/documentation/api-reference/modules/core/#avoidable) - Avoids routes that require the use of carpool (HOV/High Occupancy Vehicle) lanes.
-   [`alreadyUsedRoads`](/web/maps/documentation/api-reference/modules/core/#avoidable) - Avoids using the same road multiple times. This is important for round trips, when users may not want to use the same roads both ways. This is most useful in conjunction with [`routeType=thrilling`](https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlanner/Enums/RouteType.html).
-   [`borderCrossings`](/web/maps/documentation/api-reference/modules/core/#avoidable) - Avoids crossing country borders.
-   [`tunnels`](/web/maps/documentation/api-reference/modules/core/#avoidable) - Avoids tunnels.
-   [`carTrains`](/web/maps/documentation/api-reference/modules/core/#avoidable) - Avoids car trains.

## Vehicle profile

Vehicle profile relates to a set of parameters that are used to provide extra information about the vehicle specification. It also provides information about the current state, e.g., the level of fuel.

Some roads in the map have vehicle and time dependent restrictions. For example, roads may restrict traffic to pedestrians, or can only be used by electric vehicles. Various road types may prohibit vehicles carrying hazardous materials. Tunnels may only be passable by vehicles up to a maximum height, and for trucks, with the proper tunnel code. These restrictions may affect the routes that can be planned for the user’s vehicle.

Key parameters defining vehicle profiles (see [`VehicleParameters`](/web/maps/documentation/api-reference/modules/services/#vehicleparameters)):

-   Vehicle type, e.g., car or motorcycle (see [`TravelMode`](/web/maps/documentation/api-reference/modules/core/#travelmode)).
-   Engine type, e.g., [`combustion`] or [`electric`] (see [`VehicleEngineType`](/web/maps/documentation/api-reference/modules/services/#vehicleenginetype)). For pedestrians and bicycles, no engine is allowed.
-   Consumption parameters used to adjust the overall range prediction of the vehicle (see [`VehicleConsumption`](/web/maps/documentation/api-reference/modules/services/#vehicleconsumption)).
-   Vehicle dimensions (see [`VehicleDimensions`](/web/maps/documentation/api-reference/modules/services/#vehicledimensions)).
-   Hazardous payload describing the classification of carrying hazardous materials carried by the vehicle (see [`LoadType`](/web/maps/documentation/api-reference/modules/services/#loadtype)).
-   Tunnel codes describing which tunnels can be used (see [`VehicleParameters.adrCode`](/web/maps/documentation/api-reference/modules/services/#vehicleparameters)).

<Blockquote>

Vehicle profile properties are valid only at the current point in time and they get updated over time, e.g., the consumption curve. Vehicle profile is also useful during free driving mode without a route, e.g., to steer range features like a 360 range around the current position.

</Blockquote>

# Planning errors (TODO?)

[//]: # (If any errors occurred during the planning, the result returned by the completion block will be [`.failure&#40;error&#41;`]&#40;https://developer.apple.com/documentation/swift/result/failure&#41;. The error type is [`NSError`]&#40;https://developer.apple.com/documentation/foundation/nserror&#41; for common errors &#40;e.g., Networking&#41; and [`RoutingError`]&#40;https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlannerOnline/Classes/RoutingError.html&#41; for routing-specific errors. There are a few [`RoutingError`]&#40;https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlannerOnline/Classes/RoutingError.html&#41; codes that are returned in different situations.)

[//]: # ()
[//]: # (-   [`unknown`]&#40;https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlannerOnline/Enums/RoutingErrorCode.html&#41; - Routing call ended with an unknown error.)

[//]: # (-   [`badInput`]&#40;https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlannerOnline/Enums/RoutingErrorCode.html&#41; - The combination of input parameters was not valid.)

[//]: # (-   [`noRouteFound`]&#40;https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlannerOnline/Enums/RoutingErrorCode.html&#41; - No valid route could be found.)

[//]: # (-   [`internalError`]&#40;https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlannerOnline/Enums/RoutingErrorCode.html&#41; - The service encountered an unexpected error while fulfilling the request.)

[//]: # (-   [`cannotRestoreBaseroute`]&#40;https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlannerOnline/Enums/RoutingErrorCode.html&#41; - The route could not be reconstructed using [`supportingPoints`]&#40;https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlanner/Structs/RouteLegOptions.html#/s:03TomA10SDKRouting15RouteLegOptionsV16supportingPointsSaySo22CLLocationCoordinate2DVGvp&#41;.)

[//]: # (-   [`serviceUnavailable`]&#40;https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlannerOnline/Enums/RoutingErrorCode.html&#41; - The service is not ready to handle the request.)

[//]: # (-   [`deserialization`]&#40;https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlannerOnline/Enums/RoutingErrorCode.html&#41; - Deserialization of the routing response failed.)

[//]: # (-   [`network`]&#40;https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlannerOnline/Enums/RoutingErrorCode.html&#41; - Routing network call failed.)

[//]: # (-   [`computationTimeout`]&#40;https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlannerOnline/Enums/RoutingErrorCode.html&#41; -The request reached an internal computation time threshold and timed out.)

[//]: # (-   [`apiKeyError`]&#40;https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlannerOnline/Enums/RoutingErrorCode.html&#41; - Indicates that the API key has no permission to access this resource.)

[//]: # (-   [`mapMatchingFailure`]&#40;https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlannerOnline/Enums/RoutingErrorCode.html&#41; - One of the input points &#40;Origin, Destination, Waypoints&#41; could not be matched to the map because no drivable section near this point could be found.)

[//]: # (-   [`cancelled`]&#40;https://developer.tomtom.com/assets/downloads/tomtom-sdks/ios/api-reference/0.2.2811/TomTomSDKRoutePlannerOnline/Enums/RoutingErrorCode.html&#41; - The request has been cancelled.)
