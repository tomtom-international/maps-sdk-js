import type { AreaAnalyticsColorStop } from '@tomtom-org/maps-sdk/map';

export type ColorStopsControls = { update: (newStops: AreaAnalyticsColorStop[]) => void };

export function initColorStops(
    containerId: string,
    addButtonId: string,
    initialStops: AreaAnalyticsColorStop[],
    onChange: (stops: AreaAnalyticsColorStop[]) => void,
): ColorStopsControls {
    const stops: AreaAnalyticsColorStop[] = initialStops.slice().sort((a, b) => a.value - b.value);

    function render(): void {
        const container = document.getElementById(containerId)!;
        container.innerHTML = '';

        for (let i = 0; i < stops.length; i++) {
            const stop = stops[i];
            const row = document.createElement('div');
            row.className = 'aa-color-stop-row';

            const valueInput = document.createElement('input');
            valueInput.type = 'number';
            valueInput.className = 'sdk-example-input aa-stop-value-input';
            valueInput.min = '0';
            valueInput.max = '1';
            valueInput.step = '0.01';
            valueInput.value = stop.value.toFixed(2);
            valueInput.addEventListener('change', () => {
                stops[i] = { ...stops[i], value: Math.max(0, Math.min(1, Number(valueInput.value))) };
                stops.sort((a, b) => a.value - b.value);
                render();
                onChange(stops.slice());
            });

            const swatchLabel = document.createElement('label');
            swatchLabel.className = 'aa-color-swatch';

            const swatchInner = document.createElement('span');
            swatchInner.className = 'aa-color-swatch-inner';
            swatchInner.style.background = stop.color;

            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = stop.color;
            colorInput.addEventListener('input', () => {
                stops[i] = { ...stops[i], color: colorInput.value };
                swatchInner.style.background = colorInput.value;
                onChange(stops.slice());
            });

            swatchLabel.append(swatchInner, colorInput);

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
    }

    document.getElementById(addButtonId)!.addEventListener('click', () => {
        let maxGap = 0;
        let insertValue = 0.5;
        for (let i = 0; i < stops.length - 1; i++) {
            const gap = stops[i + 1].value - stops[i].value;
            if (gap > maxGap) {
                maxGap = gap;
                insertValue = (stops[i].value + stops[i + 1].value) / 2;
            }
        }
        stops.push({ value: Number(insertValue.toFixed(2)), color: '#ffffff' });
        stops.sort((a, b) => a.value - b.value);
        render();
        onChange(stops.slice());
    });

    render();

    return {
        update(newStops: AreaAnalyticsColorStop[]): void {
            stops.length = 0;
            stops.push(...newStops.slice().sort((a, b) => a.value - b.value));
            render();
        },
    };
}
