[![Quality Gate Status](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_maps-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=alert_status&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_maps-sdk-js_AYHTCTXCqdbqIGrKswTc)
[![Reliability Rating](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_maps-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=reliability_rating&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_maps-sdk-js_AYHTCTXCqdbqIGrKswTc)
[![Maintainability Rating](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_maps-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=sqale_rating&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_maps-sdk-js_AYHTCTXCqdbqIGrKswTc)
[![Security Rating](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_maps-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=security_rating&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_maps-sdk-js_AYHTCTXCqdbqIGrKswTc)

[![TomTom Logo](documentation/images/tomtom-logo-big.svg)](https://www.tomtom.com/)

# Maps SDK JS
[**Examples**](https://hosted-examples.maps-sdk-js.tomtom.com/main/kitchen-sink/) |
[**Documentation**](https://developer-staging.tomtom.com/maps-sdk-js/javascript/maps/documentation/overview/introduction) |
[Request feature](https://github.com/tomtom-international/maps-sdk-js/discussions) |
[Report bug](https://github.com/tomtom-international/maps-sdk-js/issues)

<br/>

Maps SDK JS is a **JavaScript** library for building applications using [**TomTom** location maps and services](https://developer.tomtom.com/).

<a href="https://hosted-examples.maps-sdk-js.tomtom.com/main/kitchen-sink/">
    <img src="documentation/images/sdk-examples-collage.png" style="width: 800px" alt="Example Thumbnails">
</a>

It leverages the power of [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) and [GeoJSON](https://geojson.org/)
to seamlessly integrate TomTom maps and services with convenient out-of-the-box support, while staying highly customizable and extensible.
<br/><br/>

## Getting Started using npm
```
npm i @anw/maps-sdk-js
```

Additionally:
* If you use the map: ```npm i maplibre-gl```
* If you use services: ```npm i axios```

(Learn more below)
<br/><br/><br/>

## Where can you run it on?
* **web**: display and configure a map, search for places, plan routes, and easily display and interact with them, including your own data
* **nodejs**: (reverse)geocode locations, (re)calculate routes, and more, to enrich data before saving or returning it
* **React Native**: leverage the power of TomTom location services from a single codebase
<br/><br/>

## Bundles
* [Map](#map): MapLibre-powered library for readily styled, service-compatible and interactive TomTom Maps
* [Services](#services): GeoJSON services for TomTom location APIs
* [Core](#core): configuration, types and utilities common to Map and Services
  <br/><br/>

## Map
The SDK [Map bundle](https://developer-staging.tomtom.com/maps-sdk-js/javascript/maps/documentation/api-reference/home#map-modules) is built on top of [MapLibre GL JS](https://maplibre.org/maplibre-gl-js-docs/api/), and shares it as a dependency with your app.\
You can both use the TomTom and MapLibre SDKs together at any time.

### Feature highlights
Readily available, yet highly customizable interactive TomTom Maps:
* in different styles: light, dark, b&w, satellite
* with configurable POIs and Live Traffic
* seamlessly integrable with TomTom [Services](#services)
* with places, routes and geometries from TomTom services or your own data

### Getting Started with Map
#### Using npm
The SDK Map uses [MapLibre GL JS](https://www.npmjs.com/package/maplibre-gl) as peer dependency.
Therefore, you need to also have it installed in your project.\
The TomTom SDK is tested against the latest stable [release  of MapLibre GL](https://github.com/maplibre/maplibre-gl-js/blob/main/CHANGELOG.md).
```
npm i @anw/maps-sdk-js maplibre-gl
```
Code imports from the SDK Map Bundle will come from ```@anw/maps-sdk-js/map```
<br/><br/>

## Services
The SDK [Services bundle](https://developer-staging.tomtom.com/maps-sdk-js/javascript/maps/documentation/api-reference/home#service-modules) integrates the TomTom location APIs into comprehensive [GeoJSON](https://geojson.org/) services.\
The services can be integrated in **web**, [nodejs](https://nodejs.org/) and [React Native](https://reactnative.dev/) apps.\
The compatibility of both inputs and outputs with [GeoJSON](https://geojson.org/) helps with further integration with geospatial tools.

### Feature highlights
* [Search](https://developer-staging.tomtom.com/maps-sdk-js/javascript/maps/documentation/api-reference/modules/search) (fuzzy search, geometry search)
* [Geocoding](https://developer-staging.tomtom.com/maps-sdk-js/javascript/maps/documentation/api-reference/modules/geocoding) and [Reverse Geocoding](https://developer-staging.tomtom.com/maps-sdk-js/javascript/maps/documentation/api-reference/modules/reverse_geocoding)
* [Geometry Data](https://developer-staging.tomtom.com/maps-sdk-js/javascript/maps/documentation/api-reference/modules/geometry_data)
* [Routing](https://developer-staging.tomtom.com/maps-sdk-js/javascript/maps/documentation/api-reference/modules/calculate_route) with EV support
* EV Charging Stations Availability

### Getting Started with Services
#### Using npm
To maximize compatibility with both web and nodejs environments of multiple versions,
the SDK Services uses [axios](https://www.npmjs.com/package/axios) and shares it with your project as a peer dependency.\
The SDK is tested against the latest stable release from Axios.
```
npm i @anw/maps-sdk-js axios
```
Code imports from the SDK Map Bundle will come from ```@anw/maps-sdk-js/services```
<br/><br/>

## Core
The SDK [Core](https://developer-staging.tomtom.com/maps-sdk-js/javascript/maps/documentation/api-reference/modules/core)
is a set of utilities and TypeScript types which are common to both [Map](#map) and [Services](#services).`

### Feature highlights
* [Common configuration](https://developer-staging.tomtom.com/maps-sdk-js/javascript/maps/documentation/api-reference/classes/core.TomTomConfig)
* Common types (such as outputs from Services which can be used as inputs to the Map)
* Utilities (such as distance/duration formatting and bounding box calculations)

### Using the Core Bundle
If you use Map and/or Services, there is no need to install any further packages.\
Code imports from the SDK Core Bundle will come from ```@anw/maps-sdk-js/core```
