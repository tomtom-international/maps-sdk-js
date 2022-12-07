import {
    ConnectorType,
    Fuel,
    GeographyType,
    GeometryDataResponse,
    HasLngLat,
    MapcodeType,
    View
} from "@anw/go-sdk-js/core";
import { MultiPolygon, Polygon, Position } from "geojson";
import { IndexTypesAbbreviation } from "../../shared/types/APIResponseTypes";
import { CommonServiceParams } from "../../shared/ServiceTypes";
import { OpeningHoursRequest, RelatedPoisRequest, TimeZoneRequest } from "../../shared/types/ServicesTypes";
import { POICategory } from "../../poi-categories/poiCategoriesToID";
import { CommonSearchParams } from "../../search/types/CommonSearchParams";

/**
 * @group Geometry Search
 * @category Types
 */
export type GeometrySearchParams = Omit<
    CommonSearchParams,
    "typeahead" | "offset" | "countries" | "radiusMeters" | "boundingBox"
> & {
    /**
     * List of geometries to search.
     * * (Also referred to as "geometryList")
     */
    geometries: SearchGeometryInput[];
};

// geo-json does not support circle as a Geometry shape
/**
 * @group Geometry Search
 * @category Interface
 */
export interface Circle {
    type: "Circle";
    coordinates: Position;
    radius: number;
}

/**
 * @group Geometry Search
 * @category Types
 */
export type SearchGeometryInput = Polygon | MultiPolygon | Circle | GeometryDataResponse;
