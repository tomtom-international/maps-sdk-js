import type { LandmarkKind } from './landmarks';

/** Adds one radio per kind of landmark to the group, the first one checked. */
export const initKindPicker = (
    group: HTMLElement,
    kinds: readonly LandmarkKind[],
    onPick: (kind: LandmarkKind) => void,
) => {
    for (const kind of kinds) {
        const label = document.createElement('label');
        label.className = 'ui-radio-label';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'landmark-kind';
        input.value = kind.id;
        input.checked = kind === kinds[0];
        input.addEventListener('change', () => onPick(kind));
        label.append(input, kind.label);
        group.append(label);
    }
};
