---
title: Specialized search
hideMenu: false
hideSubmenu: false
hasTwoColumns: false
titleTags:
- label: "VERSION 0.0.1"
  color: "grey5"
- label: "PRIVATE PREVIEW"
  color: "grey5"
---

<a style="display: block; margin: 0; padding: 0;" id="_search_along_a_route"></a>

# Search along a route (TODO)

<a style="display: block; margin: 0; padding: 0;" id="_ev_charging_stations_availability_search"></a>

# Charging station availability search

The EV charging stations availability search checks the availability of Electric Vehicle (EV) charging points at a specific charging station. To make the request, you need to call [`chargingAvailability`](/web/maps/documentation/api-reference/modules/services/#chargingavailability) and provide the corresponding [`ChargingAvailabilityParams`](/web/maps/documentation/api-reference/modules/services/#chargingavailabilityparams). The only mandatory parameter is the charging station identifier. You can get this identifier from the [`CommonPlaceProps`](/web/maps/documentation/api-reference/modules/core/#commonplaceprops) in the result of a Search. The identifier is in the [`PlaceDataSources`](/web/maps/documentation/api-reference/modules/core/#placedatasources) of a Search result, labeled [`ChargingAvailabilityDataSource`](/web/maps/documentation/api-reference/modules/core/#chargingavailabilitydatasource).

<Blockquote>

Not every Search result contains charging station information.

</Blockquote>

You can add optional restrictions to the request (see [`ChargingAvailabilityParams`](/web/maps/documentation/api-reference/modules/services/#chargingavailabilityparams)): [connector type](https://developer.tomtom.com/search-api/search-api-documentation/supported-connector-types), minimum power (expressed in kilowatts) and maximum power (expressed in kilowatts).

``` javascript
const chargingAvailabilityParams: ChargingAvailabilityParams = {
    id: chargingStationId,
    connectorTypes: ["StandardHouseholdCountrySpecific", "IEC62196Type1", "IEC62196Type1CCS"],
    minPowerKW: 1,
    maxPowerKW: 5
};
```

A request returns a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[`ChargingAvailabilityResponse`](/web/maps/documentation/api-reference/modules/services/#chargingavailabilityresponse)> object.

``` javascript
try {
    const chargingAvailabilityResponse = await chargingAvailability(chargingAvailabilityParams);
    // handle success
} catch (e) {
    // handle error
}
```

<a style="display: block; margin: 0; padding: 0;" id="_geometry_search"></a>

# Geometry search

The geometry search allows you to perform a free-form search inside one or more defined geographic areas (geometries). By default, POIs are returned as a result. For other result types, the **idxSet** parameter should be used.

There are two types of geometries that are supported:

-   [`Polygon`](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/1261ff052c0ef57ce5465c26716b96d836e048f5/types/geojson/index.d.ts#L118L125) - an array of coordinates of vertices.
    ``` javascript
    const polygon = {
        type: "Polygon",
        coordinates: [
            [
                [-122.43576, 37.75241],
                [-122.43301, 37.7066],
                [-122.36434, 37.71205],
                [-122.37396, 37.7535]
            ]
        ]
    };
    ```
-   [`Circle`](/web/maps/documentation/api-reference/interfaces/services.Circle) - center coordinates and a radius in meters.
    ``` javascript
    const circle = {
        type: "Circle",
        coordinates: [4.9041, 52.3676],
        radius: 100
    };
    ```

Provide the geometries and query to the [`GeometrySearchParams`](/web/maps/documentation/api-reference/modules/services/#geometrysearchparams) and call the [`geometrySearch`](/web/maps/documentation/api-reference/modules/services/#geometrysearch) function to make a request. You can also define optional parameters such as the number of results to return, language, and various constraints on what is searched for. More information about optional parameters and the geometry search can be found in the [Search API Geometry Search documentation](https://developer.tomtom.com/search-api/search-api-documentation-search/geometry-search).

``` javascript
const params = {
    query: "cafe",
    geometries: [polygon, circle],
};
```

The response is presented as a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[`GeometrySearchResponse`](/web/maps/documentation/api-reference/modules/services/#geometrysearchresponse)>.

``` javascript
try {
    const geometrySearchResponse = await geometrySearch(params);
    // handle success
} catch (e) {
    // handle failure
}
```

<a style="display: block; margin: 0; padding: 0;" id="_geometry_data_search"></a>

# Geometry data search

Geometry data search is used to obtain geometries to represent the outline of a city, county, or land area. It supports batch requests for up to 20 identifiers per call. To make the Geometry Data search request, use the [`geometryData`](/web/maps/documentation/api-reference/modules/services/#geometrydata) and provide it [`GeometryDataParams`](/web/maps/documentation/api-reference/modules/services/#geometrydataparams). The only required parameter is a list of identifiers you want to get geometry for. To get these identifiers, first get the [`PlaceDataSources`](/web/maps/documentation/api-reference/modules/core/#placedatasources) in the [`CommonPlaceProps`](/web/maps/documentation/api-reference/modules/core/#commonplaceprops) of a Search result. Then use its [`GeometryDataSource`](/web/maps/documentation/api-reference/modules/core/#geometrydatasource) property to get the geometry ID.

<Blockquote>

Not every Search result has this information.

</Blockquote>

```javascript
// TODO: show getting geometryId from search result (once we have some centralized search service)
```

You can provide an optional zoom level parameter, which defines the precision of the returned geometries. For more information about the additional data search, see [`GeometryDataParams`](/web/maps/documentation/api-reference/modules/services/#geometrydataparams) and go to the [Search API Additional Data Search documentation](https://developer.tomtom.com/search-api/search-api-documentation/additional-data).
```javascript
const geometryDataParams = {
    geometries: geometriesIds,
    zoom: 14
};
```

The call returns a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[`GeometryDataResponse`](/web/maps/documentation/api-reference/modules/core/#geometrydataresponse)> object.

``` javascript
try {
    const areaGeometry = await geometryData(geometryDataParams);
    // handle success
} catch (e) {
    // handle failure
}
```
