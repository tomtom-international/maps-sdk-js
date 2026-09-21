import type {
    DrawnSectionType,
    RoutingModuleConfig,
    SectionDisplayConfig,
    SectionsDisplayConfig,
} from '@tomtom-org/maps-sdk/map';
import { drawnSectionTypes } from '@tomtom-org/maps-sdk/map';

/**
 * The panel's state is the config itself: one `SectionDisplayConfig` per section type, exactly as
 * `sections` takes them. A knob left `undefined` is left out, so the type keeps its own default.
 */
export type PanelState = {
    sections: Record<DrawnSectionType, SectionDisplayConfig>;
};

/**
 * Where the `sign.minzoom` slider starts, which is the module's own default. Lowering it does less
 * than it looks: a sign is repeated along its stretch and none is drawn where the stretch is too
 * short on screen to carry one, so the zoom floor only matters once the stretches are long enough.
 */
export const PLAYGROUND_SIGN_MINZOOM = 9;

export const buildInitialState = (): PanelState => ({
    sections: Object.fromEntries(drawnSectionTypes.map((type) => [type, {}])) as Record<
        DrawnSectionType,
        SectionDisplayConfig
    >,
});

// Only the types the panel actually touched, so the config stays a diff against the defaults rather
// than a dump of all sixteen. The panel renders a control only where `sectionSupportsKnob` reports
// one, so what it collected per type is what that type accepts — which TypeScript cannot see
// through a record keyed by all sixteen at once.
const configuredSections = (state: PanelState): SectionsDisplayConfig =>
    Object.fromEntries(
        drawnSectionTypes
            .filter((type) => Object.keys(state.sections[type]).length > 0)
            .map((type) => [type, state.sections[type]]),
    ) as SectionsDisplayConfig;

export const buildConfig = (state: PanelState): RoutingModuleConfig => ({
    sections: configuredSections(state),
});
