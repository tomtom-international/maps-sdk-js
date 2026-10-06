import { getKnob, type KnobEntry, type KnobTarget, setKnob } from '@tomtom-org/maps-sdk/map';
import { controlFor } from './knobControls';

// What the panel needs of a module: every map module has these.
type KnobModule = KnobTarget<object> & {
    events: { on(type: 'config-change', handler: () => void): unknown };
};

// One control per catalogue entry, each setting its knob by id. A change from anywhere else (the
// icon toggles, the module's own setters) rebuilds the controls.
export const initKnobPanel = (
    containerId: string,
    catalogue: readonly KnobEntry<string>[],
    module: KnobModule,
): void => {
    const container = document.getElementById(containerId) as HTMLElement;
    // A rebuild would replace the very control the pointer is on.
    let applyingFromPanel = false;

    const render = () => {
        container.replaceChildren(
            ...catalogue.flatMap(
                (knob) =>
                    controlFor(knob, getKnob(module, catalogue, knob.id), (value) => {
                        applyingFromPanel = true;
                        try {
                            setKnob(module, catalogue, knob.id, value);
                        } finally {
                            applyingFromPanel = false;
                        }
                    }) ?? [],
            ),
        );
    };

    render();
    module.events.on('config-change', () => {
        if (!applyingFromPanel) render();
    });
};
