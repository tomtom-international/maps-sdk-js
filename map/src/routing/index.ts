/**
 * @module map-routes
 */

export * from './layers/routingLayers';
export {
    type BespokeSectionType,
    bespokeSectionTypes,
    type DrawnSectionType,
    drawnSectionTypes,
    type GeneratedSectionType,
    generatedSectionTypes,
    type SectionDrawStyle,
    type SectionKnobName,
    type SectionKnobOf,
    type SectionLinePattern,
    type SectionSourceKey,
    sectionDrawsByDefault,
    sectionSourceKey,
    sectionSupportsKnob,
} from './layers/sectionRegistry';
export * from './layers/shared';
export * from './RoutingModule';
export type * from './types/displayRoutes';
export type * from './types/planningWaypoint';
export type * from './types/routeModuleConfig';
export * from './types/waypointDisplayProps';
