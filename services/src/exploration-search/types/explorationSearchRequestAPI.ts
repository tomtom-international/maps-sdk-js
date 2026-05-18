import type { BBox } from '@tomtom-org/maps-sdk/core';
import type { MultiPolygon, Polygon, Position } from 'geojson';
import type { PostObject } from '../../shared';
import type { AreaTag } from './areaTags';
import type { ExplorationRecordType } from './explorationSearchParams';

/**
 * @ignore
 */
export type NearAPI = {
    coordinates: Position;
    radius_km: number;
};

/**
 * @ignore
 */
export type ExplorationSearchPayloadAPI = {
    q?: string;
    country?: string;
    municipalities?: string[];
    brand?: string;
    categories?: string[];
    types?: ExplorationRecordType[];
    area_id?: string;
    area_tags?: AreaTag[];
    near?: NearAPI;
    bboxes?: BBox[];
    geometries?: (Polygon | MultiPolygon)[];
    from?: number;
    size?: number;
};

/**
 * Exploration search request type.
 * @ignore
 */
export type ExplorationSearchRequestAPI = PostObject<ExplorationSearchPayloadAPI>;
