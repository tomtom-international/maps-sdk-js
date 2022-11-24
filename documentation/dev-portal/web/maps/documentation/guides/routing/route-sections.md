---
title: Route sections
hideMenu: false
hideSubmenu: false
hasTwoColumns: false
titleTags:
- label: "VERSION 0.0.1"
  color: "grey5"
- label: "PRIVATE PREVIEW"
  color: "grey5"
---

Route sections are parts of the planned [`Route`](/web/maps/documentation/api-reference/modules/core/#route) that have specific characteristics, such as ones on a ferry or motorway, or sections with traffic incidents in them. Using sections, you can show users where these things lie on a planned route. The list of supported section types can be found further in this guide.

Each section in the response has two basic properties:

- [`startPointIndex`](/web/maps/documentation/api-reference/modules/core/#section) - the route path point index where this section starts.
- [`endPointIndex`](/web/maps/documentation/api-reference/modules/core/#section) - the route path point index where this section ends.

However, some specific section types return additional information about the section.

The [`Sections`](/web/maps/documentation/api-reference/modules/core/#sections) type contains a list of supported sections. The possible section types are:

-   [`leg`](/web/maps/documentation/api-reference/modules/core/#legsection) - Represents a route leg, which is the portion between two regular (non-circle) waypoints.
    - It provides a [`Summary`](/web/maps/documentation/api-reference/modules/core/#summary) of the route leg.
-   [`traffic`](/web/maps/documentation/api-reference/modules/core/#trafficsection) - Represents a route section with traffic information. It also provides:
    - The category of the incident. There will never be more than one incident in any section.
    - The delay caused by the incident (in seconds).
    - The magnitude of the delay caused by the incident.
    - Detailed information about the incident (TPEG2-TEC standard).
    - The average effective speed in that section (in km/h).
-   [`travelMode`](/web/maps/documentation/api-reference/modules/core/#travelmodesection) - Represents a route section with travel mode. This section type is related to the [`TravelMode`](/web/maps/documentation/api-reference/modules/core/#travelmode) request parameter.
    - Provides the [`TravelMode`](/web/maps/documentation/api-reference/modules/core/#travelmode) in this section.
-   [`tollRoad`](/web/maps/documentation/api-reference/modules/core/#sections) - Represents a route section that requires a toll payment.
-   [`ferry`](/web/maps/documentation/api-reference/modules/core/#sections) - Represents a route section that is a ferry.
-   [`motorway`](/web/maps/documentation/api-reference/modules/core/#sections) - Represents a route section that is a motorway.
-   [`carTrain`](/web/maps/documentation/api-reference/modules/core/#sections) - Represents a route section that has a car train.
-   [`tunnel`](/web/maps/documentation/api-reference/modules/core/#sections) - Represents a route section with a tunnel.
-   [`pedestrian`](/web/maps/documentation/api-reference/modules/core/#sections) - Represents a route section with pedestrian area.
-   [`tollVignette`](/web/maps/documentation/api-reference/modules/core/#countrysection) - Represents a route section that requires a toll vignette.
    - It provides the 3-character ISO 3166-1 alpha-3 country code in which the section is located.
-   [`country`](/web/maps/documentation/api-reference/modules/core/#countrysection) - Represents a route section that is passing through a specific country.
    - It provides the 3-character ISO 3166-1 alpha-3 country code in which the section is located.
-   [`urban`](/web/maps/documentation/api-reference/modules/core/#sections) - Represents a route section that is location within urban areas.
-   [`carpool`](/web/maps/documentation/api-reference/modules/core/#sections) - Represents a route section that requires use of carpool (HOV/High Occupancy Vehicle) lanes.
-   [`unpaved`](/web/maps/documentation/api-reference/modules/core/#sections) - Represents a route section with an unpaved road.
