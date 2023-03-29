import { Place, Places } from "@anw/maps-sdk-js/core";
import { CommonServiceParams } from "../../shared";

/**
 * Geometry IDs or places containing them.
 */
export type GeometriesInput = string[] | Place[];

type CommonServiceParamsWithZoom = CommonServiceParams & {
    /**
     * Optional zoom parameter.
     * * It can be an integer from 0 until 22.
     * * When using a map, it is recommended to align the current map zoom to this value.
     * * It is very recommended as well for very large geographies, avoiding fetching too detailed zoom levels when possible.
     */
    zoom?: number;
};

/**
 * Input parameters to fetch geometry data for given IDs or places.
 */
export type GeometryDataParams = CommonServiceParamsWithZoom & {
    /**
     * Geometry IDs or places containing them.
     * * Mandatory.
     * * Min length: 1.
     * * Max length: 20.
     */
    geometries: GeometriesInput;
};

/**
 * Input parameters to fetch geometry data for places.
 */
export type GeometryPlaceParams = CommonServiceParamsWithZoom & {
    /**
     * Place containing geometry IDs.
     */
    geometries: Places;
};

/**
 * Input parameters to fetch geometry data for given IDs or places.
 * * GeometryDataParams - Use array of geometries IDs or Places
 * * GeometryPlaceParams - Use a Place to fetch geometry IDs
 */
export type GeometryParams = GeometryDataParams | GeometryPlaceParams;
