import { type EffectKnobId, type EffectKnobValueOf, effectKnobDefinitions, effectKnobIds } from './effectsCatalogue';

/**
 * Every effect knob with a value: the settings with the catalogue defaults filled in.
 * @ignore
 */
export type EffectValues = { [ID in EffectKnobId]: EffectKnobValueOf<ID> };

/**
 * @ignore
 */
export const withDefaults = (settings: Partial<EffectValues>): EffectValues =>
    Object.fromEntries(
        effectKnobIds.map((id) => [id, settings[id] ?? effectKnobDefinitions[id].default]),
    ) as EffectValues;
