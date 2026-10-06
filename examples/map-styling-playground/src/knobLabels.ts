import type { KnobEntry } from '@tomtom-org/maps-sdk/map';

// 'roads.exitNumbers.visible' -> 'Exit numbers': the part after the last dot, past a toggle's
// `visible`, names the control.
export const labelOf = (knob: KnobEntry<string>): string => {
    const id = knob.id.replace(/\.visible$/, '');
    const name = id.slice(id.lastIndexOf('.') + 1).replace(/([A-Z])/g, ' $1');
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

// Everything before the last dot names the group: 'labels.sizeFactor' -> 'labels'.
export const groupOf = (knob: KnobEntry<string>): string => knob.id.slice(0, knob.id.lastIndexOf('.'));

// 'traffic flow' -> 'Traffic flow'.
export const titleOf = (group: string): string => {
    const words = group.split('.').join(' ');
    return words === 'pois' ? 'POIs' : words.charAt(0).toUpperCase() + words.slice(1);
};
