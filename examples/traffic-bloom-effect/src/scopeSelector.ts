import type { StylingColorKnobId } from '@tomtom-org/maps-sdk/map';
import type { BloomScope, StylingColorKnobGroup } from '@tomtom-org/maps-sdk-plugin-map-effects';

// Typed against the SDK's colour knobs and groups, so a name the catalogue lacks fails to compile.
const SCOPES = {
    everything: { label: 'The whole map', scope: [] },
    traffic: { label: 'All traffic', scope: ['traffic'] },
    major: {
        label: 'Major jams and closures only',
        scope: ['traffic.incidents.majorColor', 'traffic.incidents.closedColor'],
    },
} as const satisfies Record<string, { label: string; scope: readonly (StylingColorKnobId | StylingColorKnobGroup)[] }>;

type ScopeKey = keyof typeof SCOPES;

const isScopeKey = (value: string): value is ScopeKey => value in SCOPES;

/** Fills the scope dropdown, selects the entry matching `current`, and reports every pick. */
export const initScopeSelector = (current: BloomScope, onPick: (scope: BloomScope) => void): void => {
    const selector = document.querySelector('#ui-scope') as HTMLSelectElement;
    selector.innerHTML = Object.entries(SCOPES)
        .map(([key, { label, scope }]) => {
            const selected = scope.join() === current.join() ? ' selected' : '';
            return `<option value="${key}"${selected}>${label}</option>`;
        })
        .join('');
    selector.addEventListener('change', () => {
        if (isScopeKey(selector.value)) onPick(SCOPES[selector.value].scope);
    });
};
