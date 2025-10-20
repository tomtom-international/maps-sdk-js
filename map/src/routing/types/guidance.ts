import type { Instruction } from '@cet/maps-sdk-js/core';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import type { DisplayRouteRelatedProps } from './displayRoutes';

/**
 * @ignore
 */
export type DisplayInstructionArrowProps = {
    lastPointBearingDegrees: number;
};

/**
 * @ignore
 */
export type DisplayInstructionArrow = Feature<
    Point,
    Instruction & DisplayInstructionArrowProps & DisplayRouteRelatedProps
>;

/**
 * @ignore
 */
export type DisplayInstructionArrows = FeatureCollection<
    Point,
    Instruction & DisplayInstructionArrowProps & DisplayRouteRelatedProps
>;

/**
 * @ignore
 */
export type DisplayInstruction = Feature<LineString, Instruction & DisplayRouteRelatedProps>;

/**
 * @ignore
 */
export type DisplayInstructions = FeatureCollection<LineString, Instruction & DisplayRouteRelatedProps>;
