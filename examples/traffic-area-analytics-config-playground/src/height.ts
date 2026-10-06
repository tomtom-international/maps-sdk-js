import type { AreaAnalyticsMetricKey } from '@tomtom-org/maps-sdk/core';
import type { AreaAnalyticsHeightConfig } from '@tomtom-org/maps-sdk/map';

type ScaleMode = NonNullable<AreaAnalyticsHeightConfig['scaleMode']>;

/** A height knob of the active metric, by its path below `metrics.<metric>.height`. */
export type HeightKnob = 'scaleMode' | 'maxMeters' | 'metersPerUnit' | 'minMeters';

export type HeightControls = {
    update: (metric: AreaAnalyticsMetricKey, config?: AreaAnalyticsHeightConfig) => void;
};

export const initHeightControls = (
    maxHeightId: string,
    metersPerUnitId: string,
    minHeightId: string,
    scaleModeId: string,
    setHeightKnob: (knob: HeightKnob, value: number | ScaleMode) => void,
): HeightControls => {
    const maxHeightInput = document.getElementById(maxHeightId) as HTMLInputElement;
    const metersPerUnitInput = document.getElementById(metersPerUnitId) as HTMLInputElement;
    const minHeightInput = document.getElementById(minHeightId) as HTMLInputElement;
    const scaleModeSelect = document.getElementById(scaleModeId) as HTMLSelectElement;

    const updateFieldVisibility = (): void => {
        const isRaw = scaleModeSelect.value === 'raw';
        maxHeightInput.closest<HTMLElement>('.aa-field-row')!.style.display = isRaw ? 'none' : '';
        metersPerUnitInput.closest<HTMLElement>('.aa-field-row')!.style.display = isRaw ? '' : 'none';
    };

    // An emptied input goes back to the knob's default, which its placeholder shows. A value the knob
    // refuses, such as a negative height, is reported on the input and not applied.
    const bindNumberInput = (input: HTMLInputElement, knob: HeightKnob): void =>
        input.addEventListener('change', () => {
            try {
                setHeightKnob(knob, Number(input.value.trim() === '' ? input.placeholder : input.value));
                input.setCustomValidity('');
            } catch (error) {
                input.setCustomValidity(error instanceof Error ? error.message : String(error));
                input.reportValidity();
            }
        });

    scaleModeSelect.addEventListener('change', () => {
        updateFieldVisibility();
        setHeightKnob('scaleMode', scaleModeSelect.value as ScaleMode);
    });
    bindNumberInput(maxHeightInput, 'maxMeters');
    bindNumberInput(metersPerUnitInput, 'metersPerUnit');
    bindNumberInput(minHeightInput, 'minMeters');

    updateFieldVisibility();

    return {
        update(_metric: AreaAnalyticsMetricKey, config?: AreaAnalyticsHeightConfig): void {
            const isRaw = config?.scaleMode === 'raw';
            scaleModeSelect.value = config?.scaleMode ?? 'predefinedRange';
            updateFieldVisibility();

            if (isRaw) {
                metersPerUnitInput.value = config?.metersPerUnit != null ? String(config.metersPerUnit) : '';
                maxHeightInput.value = '';
            } else {
                maxHeightInput.value = config?.maxMeters != null ? String(config.maxMeters) : '';
                metersPerUnitInput.value = '';
            }
            minHeightInput.value = config?.minMeters != null ? String(config.minMeters) : '';
        },
    };
};
