import { Place, Places } from "@anw/go-sdk-js/core";
import { CommonServiceParams } from "../../shared/ServiceTypes";

/**
 * Geometry IDs or places containing them.
 * @group Geometry Data
 * @categpry Types
 */
export type GeometriesInput = string[] | Place[] | Places;

/**
 * Input parameters to fetch geometry data for given IDs or places.
 * @group Geometry Data
 * @category Types
 */
export type GeometryDataParams = CommonServiceParams & {
    /**
     * Geometry IDs or places containing them.
     * * Mandatory.
     * * Min length: 1.
     * * Max length: 20.
     */
    geometries: GeometriesInput;

    /**
     * Optional zoom parameter.
     * * It can be an integer from 0 until 22.
     * * When using a map, it is recommended to align the current map zoom to this value.
     * * It is very recommended as well for very large geographies, avoiding fetching too detailed zoom levels when possible.
     */
    zoom?: number;
};
