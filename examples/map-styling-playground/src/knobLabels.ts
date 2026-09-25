import type { StylingKnobDescriptor } from '@tomtom-org/maps-sdk/map';

// 'roads.exitNumbers' -> 'Exit numbers': the part after the last dot names the control.
export const labelOf = (knob: StylingKnobDescriptor): string => {
    const name = knob.id.slice(knob.id.lastIndexOf('.') + 1).replace(/([A-Z])/g, ' $1');
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

// Everything before the last dot names the group, so `traffic.flow.*` and `traffic.incidents.*`
// become two groups rather than one. They have to: both carry a `widthFactor` and a `closedColor`,
// so in a single "traffic" section two controls would read "Width factor" with nothing to tell them
// apart.
export const groupOf = (knob: StylingKnobDescriptor): string => knob.id.slice(0, knob.id.lastIndexOf('.'));

// 'traffic.flow' -> 'Traffic flow'.
export const titleOf = (group: string): string => {
    const words = group.split('.').join(' ');
    return words === 'pois' ? 'POIs' : words.charAt(0).toUpperCase() + words.slice(1);
};
