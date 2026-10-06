import type {
    CountryCrossingConfig,
    DrawnSectionType,
    RoutingModuleConfig,
    SectionDisplayConfig,
    SectionsDisplayConfig,
} from '@tomtom-org/maps-sdk/map';
import { drawnSectionTypes } from '@tomtom-org/maps-sdk/map';

/**
 * The panel's state is the config itself: one `SectionDisplayConfig` per section type, exactly as
 * `sections` takes them, plus the border crossings, which are not a section type. A knob left
 * `undefined` is left out, so the type keeps its own default.
 */
export type PanelState = {
    sections: Record<DrawnSectionType, SectionDisplayConfig>;
    countryCrossings: CountryCrossingConfig;
};

export const buildInitialState = (): PanelState => ({
    sections: Object.fromEntries(drawnSectionTypes.map((type) => [type, {}])) as Record<
        DrawnSectionType,
        SectionDisplayConfig
    >,
    countryCrossings: {},
});

// Only the types the panel actually touched, so the config stays a diff against the defaults rather
// than a dump of all fifteen. The panel renders a control only where `sectionSupportsKnob` reports
// one, so what it collected per type is what that type accepts — which TypeScript cannot see
// through a record keyed by all fifteen at once.
const configuredSections = (state: PanelState): SectionsDisplayConfig =>
    Object.fromEntries(
        drawnSectionTypes
            .filter((type) => Object.keys(state.sections[type]).length > 0)
            .map((type) => [type, state.sections[type]]),
    ) as SectionsDisplayConfig;

export const buildConfig = (state: PanelState): RoutingModuleConfig => ({
    sections: configuredSections(state),
    countryCrossings: state.countryCrossings,
});
