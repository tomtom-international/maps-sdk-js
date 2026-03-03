import { Avoidable, avoidableTypes } from '@tomtom-org/maps-sdk/core';

export const setupAvoidOptions = (onChange: () => Promise<void>, onReset: () => Promise<void>) => {
    const activeAvoidTypes = new Set<Avoidable>();

    const avoidTypesList = document.getElementById('avoid-types-list') as HTMLDivElement;
    for (const type of avoidableTypes) {
        const label = document.createElement('label');
        label.className = 'sdk-example-checkbox-label';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = type;
        checkbox.id = `avoid-type-${type}`;
        checkbox.addEventListener('change', async () => {
            checkbox.checked ? activeAvoidTypes.add(type) : activeAvoidTypes.delete(type);
            await onChange();
        });
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(type));
        avoidTypesList.appendChild(label);
    }

    (document.getElementById('reset-button') as HTMLButtonElement).addEventListener('click', async () => {
        activeAvoidTypes.clear();
        document.querySelectorAll<HTMLInputElement>('#avoid-types-list input[type="checkbox"]').forEach((cb) => {
            cb.checked = false;
        });
        await onReset();
    });

    return {
        get activeAvoidTypes(): ReadonlySet<Avoidable> {
            return activeAvoidTypes;
        },
    };
};
