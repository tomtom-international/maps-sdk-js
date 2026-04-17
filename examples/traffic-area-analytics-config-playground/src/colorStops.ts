import type { AreaAnalyticsColorStop } from '@tomtom-org/maps-sdk/map';

export type ColorStopsControls = {
    update: (newStops: AreaAnalyticsColorStop[], range?: { min: number; max: number }) => void;
};

const stepForRange = (min: number, max: number): number => {
    const span = max - min;
    if (span < 5) return 0.01;
    if (span < 50) return 0.1;
    return 1;
};

export const initColorStops = (
    containerId: string,
    addButtonId: string,
    initialStops: AreaAnalyticsColorStop[],
    initialRange: { min: number; max: number },
    onChange: (stops: AreaAnalyticsColorStop[]) => void,
): ColorStopsControls => {
    const stops: AreaAnalyticsColorStop[] = initialStops.slice().sort((a, b) => a.value - b.value);
    let range = { ...initialRange };

    const clamp = (v: number): number => Math.max(range.min, Math.min(range.max, v));

    const render = (): void => {
        const container = document.getElementById(containerId)!;
        container.innerHTML = '';
        const step = stepForRange(range.min, range.max);

        for (let i = 0; i < stops.length; i++) {
            const stop = stops[i];
            const row = document.createElement('div');
            row.className = 'aa-color-stop-row';

            const valueInput = document.createElement('input');
            valueInput.type = 'number';
            valueInput.className = 'sdk-example-input aa-stop-value-input';
            valueInput.min = String(range.min);
            valueInput.max = String(range.max);
            valueInput.step = String(step);
            valueInput.value = String(stop.value);
            valueInput.addEventListener('change', () => {
                stops[i] = { ...stops[i], value: clamp(Number(valueInput.value)) };
                stops.sort((a, b) => a.value - b.value);
                render();
                onChange(stops.slice());
            });

            const swatchLabel = document.createElement('label');
            swatchLabel.className = 'sdk-example-color-swatch';

            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = stop.color;
            colorInput.addEventListener('input', () => {
                stops[i] = { ...stops[i], color: colorInput.value };
                onChange(stops.slice());
            });

            swatchLabel.append(colorInput);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'aa-stop-remove';
            removeBtn.setAttribute('aria-label', 'Remove stop');
            removeBtn.innerHTML = '&times;';
            removeBtn.disabled = stops.length <= 2;
            removeBtn.addEventListener('click', () => {
                stops.splice(i, 1);
                render();
                onChange(stops.slice());
            });

            row.append(valueInput, swatchLabel, removeBtn);
            container.appendChild(row);
        }
    };

    document.getElementById(addButtonId)!.addEventListener('click', () => {
        const step = stepForRange(range.min, range.max);
        let maxGap = 0;
        let insertValue = (range.min + range.max) / 2;
        for (let i = 0; i < stops.length - 1; i++) {
            const gap = stops[i + 1].value - stops[i].value;
            if (gap > maxGap) {
                maxGap = gap;
                insertValue = (stops[i].value + stops[i + 1].value) / 2;
            }
        }
        const precision = step < 0.1 ? 2 : step < 1 ? 1 : 0;
        stops.push({ value: Number(insertValue.toFixed(precision)), color: '#ffffff' });
        stops.sort((a, b) => a.value - b.value);
        render();
        onChange(stops.slice());
    });

    render();

    return {
        update(newStops: AreaAnalyticsColorStop[], newRange?: { min: number; max: number }): void {
            if (newRange) range = { ...newRange };
            stops.length = 0;
            stops.push(...newStops.slice().sort((a, b) => a.value - b.value));
            render();
        },
    };
};
