import { type TollTransponder, tollTransponderOptions, type VehicleParameters } from '@tomtom-org/maps-sdk/services';

const weightSelect = document.getElementById('vehicle-weight') as HTMLSelectElement;
const maxSpeedSelect = document.getElementById('vehicle-max-speed') as HTMLSelectElement;
const transponderSelect = document.getElementById('vehicle-toll-transponder') as HTMLSelectElement;

export const setupVehicleOptions = (onChange: () => Promise<void>) => {
    for (const option of tollTransponderOptions) {
        transponderSelect.add(new Option(option, option, option === 'unknown', option === 'unknown'));
    }
    for (const select of [weightSelect, maxSpeedSelect, transponderSelect]) {
        select.addEventListener('change', onChange);
    }

    return {
        get vehicle(): VehicleParameters {
            const weightKG = Number(weightSelect.value);
            return {
                ...(weightKG && { model: { dimensions: { weightKG } } }),
                restrictions: {
                    maxSpeedKMH: Number(maxSpeedSelect.value),
                    tollTransponder: transponderSelect.value as TollTransponder,
                },
            };
        },
        reset: () => {
            weightSelect.selectedIndex = 0;
            maxSpeedSelect.selectedIndex = 0;
            transponderSelect.value = 'unknown';
        },
    };
};
