import { MercatorCoordinate } from 'maplibre-gl';
import type { Mesh, Object3D } from 'three';

/**
 * @ignore
 */
export const isMesh = (object: Object3D): object is Mesh => (object as Mesh).isMesh === true;

const EARTH_RADIUS_METRES = 6378137;

/**
 * Scale from EPSG:3857 (Web Mercator) metres, centred on the equator and the prime meridian, to
 * MapLibre's mercator units, where the world spans [0..1].
 * @ignore
 */
export const MERCATOR_UNITS_PER_METRE = 1 / (2 * Math.PI * EARTH_RADIUS_METRES);

/**
 * Converts EPSG:3857 (Web Mercator) metres to `[longitude, latitude]` degrees.
 * @ignore
 */
export const mercatorMetresToLngLat = (x: number, y: number): [number, number] =>
    new MercatorCoordinate(0.5 + x * MERCATOR_UNITS_PER_METRE, 0.5 - y * MERCATOR_UNITS_PER_METRE).toLngLat().toArray();
