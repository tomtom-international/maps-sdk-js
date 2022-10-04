import { CommonServiceParams } from "../../shared/ServiceTypes";

export type GeometryDataParams = CommonServiceParams & {
    /**
     * Mandatory parameter with the geometry IDs.
     * * Min length: 1.
     * * Max length: 20.
     */
    geometries: string[];
    /**
     * Optional zoom parameter.
     * * It can be an integer from 0 until 22.
     * * When using a map, it is recommended to align the current map zoom to this value.
     * * It is very recommended as well for very large geographies.
     */
    zoom?: number;
};
