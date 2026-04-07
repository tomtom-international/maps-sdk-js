import type { AreaAnalyticsMetricKey } from '@tomtom-org/maps-sdk/core';
import type { AreaAnalyticsHeightConfig } from '@tomtom-org/maps-sdk/map';

const DEFAULT_MAX_HEIGHT = 1000;
const DEFAULT_SCALE_FACTOR = 1;

export type HeightControls = {
    update: (metric: AreaAnalyticsMetricKey, config?: AreaAnalyticsHeightConfig) => void;
};

export const initHeightControls = (
    maxHeightId: string,
    scaleFactorId: string,
    minHeightId: string,
    scaleModeId: string,
    initialMetric: AreaAnalyticsMetricKey,
    onChange: (config: AreaAnalyticsHeightConfig) => void,
): HeightControls => {
    const maxHeightInput = document.getElementById(maxHeightId) as HTMLInputElement;
    const scaleFactorInput = document.getElementById(scaleFactorId) as HTMLInputElement;
    const minHeightInput = document.getElementById(minHeightId) as HTMLInputElement;
    const scaleModeSelect = document.getElementById(scaleModeId) as HTMLSelectElement;

    maxHeightInput.placeholder = String(DEFAULT_MAX_HEIGHT);
    scaleFactorInput.placeholder = String(DEFAULT_SCALE_FACTOR);

    const updateFieldVisibility = (): void => {
        const isRaw = scaleModeSelect.value === 'raw';
        maxHeightInput.closest<HTMLElement>('.aa-field-row')!.style.display = isRaw ? 'none' : '';
        scaleFactorInput.closest<HTMLElement>('.aa-field-row')!.style.display = isRaw ? '' : 'none';
    };

    const emit = (): void => {
        const isRaw = scaleModeSelect.value === 'raw';
        if (isRaw) {
            const config: AreaAnalyticsHeightConfig = { scaleMode: 'raw' };
            if (scaleFactorInput.value.trim() !== '') config.scaleFactor = Math.max(0, Number(scaleFactorInput.value));
            if (minHeightInput.value.trim() !== '') config.minHeightMeters = Math.max(0, Number(minHeightInput.value));
            onChange(config);
        } else {
            const config: AreaAnalyticsHeightConfig = {
                scaleMode: scaleModeSelect.value as 'predefinedRange' | 'currentRange',
            };
            if (maxHeightInput.value.trim() !== '') config.maxHeightMeters = Math.max(0, Number(maxHeightInput.value));
            if (minHeightInput.value.trim() !== '') config.minHeightMeters = Math.max(0, Number(minHeightInput.value));
            onChange(config);
        }
    };

    scaleModeSelect.addEventListener('change', () => {
        updateFieldVisibility();
        emit();
    });
    maxHeightInput.addEventListener('change', emit);
    scaleFactorInput.addEventListener('change', emit);
    minHeightInput.addEventListener('change', emit);

    updateFieldVisibility();

    return {
        update(_metric: AreaAnalyticsMetricKey, config?: AreaAnalyticsHeightConfig): void {
            const isRaw = config?.scaleMode === 'raw';
            scaleModeSelect.value = config?.scaleMode ?? 'predefinedRange';
            updateFieldVisibility();

            if (isRaw) {
                scaleFactorInput.value = config?.scaleFactor != null ? String(config.scaleFactor) : '';
                maxHeightInput.value = '';
            } else {
                maxHeightInput.value = config?.maxHeightMeters != null ? String(config.maxHeightMeters) : '';
                scaleFactorInput.value = '';
            }
            minHeightInput.value = config?.minHeightMeters != null ? String(config.minHeightMeters) : '';
        },
    };
};
