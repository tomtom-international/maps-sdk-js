import type { Routes } from '@anw/maps-sdk-js/core';
import calcBearing from '@turf/bearing';
import type { DisplayRouteProps } from '../types/displayRoutes';
import type {
    DisplayInstruction,
    DisplayInstructionArrow,
    DisplayInstructionArrows,
    DisplayInstructions,
} from '../types/guidance';

/**
 * @ignore
 */
export const toDisplayInstructions = (routes: Routes<DisplayRouteProps>): DisplayInstructions => ({
    type: 'FeatureCollection',
    features: routes.features.flatMap(
        (route, routeIndex) =>
            route.properties.guidance?.instructions
                ?.filter((instruction) => instruction.routePath?.length)
                .map(
                    (instruction): DisplayInstruction => ({
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: instruction.routePath.map((pathPoint) => pathPoint.point),
                        },
                        properties: { ...instruction, routeIndex, routeStyle: route.properties.routeStyle },
                    }),
                ) || [],
    ),
});

/**
 * @ignore
 */
export const toDisplayInstructionArrows = (routes: Routes<DisplayRouteProps>): DisplayInstructionArrows => ({
    type: 'FeatureCollection',
    features: routes.features.flatMap(
        (route, routeIndex) =>
            route.properties.guidance?.instructions
                ?.filter((instruction) => instruction.routePath?.length && instruction.routePath.length > 1)
                .map((instruction): DisplayInstructionArrow => {
                    const instructionLastSegment = [
                        instruction.routePath[instruction.routePath.length - 2]?.point,
                        instruction.routePath[instruction.routePath.length - 1]?.point,
                    ];

                    return {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: instructionLastSegment[1] },
                        properties: {
                            ...instruction,
                            routeIndex,
                            routeStyle: route.properties.routeStyle,
                            lastPointBearingDegrees: calcBearing(instructionLastSegment[0], instructionLastSegment[1]),
                        },
                    };
                }) || [],
    ),
});
