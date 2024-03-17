import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { Instruction } from "@anw/maps-sdk-js/core";
import type { DisplayRouteRelatedProps } from "./displayRoutes";

export type DisplayInstructionArrowProps = {
    lastPointBearingDegrees: number;
};

export type DisplayInstructionArrow = Feature<
    Point,
    Instruction & DisplayInstructionArrowProps & DisplayRouteRelatedProps
>;

export type DisplayInstructionArrows = FeatureCollection<
    Point,
    Instruction & DisplayInstructionArrowProps & DisplayRouteRelatedProps
>;

export type DisplayInstruction = Feature<LineString, Instruction & DisplayRouteRelatedProps>;

export type DisplayInstructions = FeatureCollection<LineString, Instruction & DisplayRouteRelatedProps>;
