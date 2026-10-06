import type { GeopoliticalView } from '@tomtom-org/maps-sdk/core';
import { geopoliticalViews } from '@tomtom-org/maps-sdk/core';

const viewSelect = document.querySelector('#ui-viewSelect') as HTMLSelectElement;

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

const viewLabel = (view: GeopoliticalView): string => (view === 'Unified' ? view : `${view}: ${countryNames.of(view)}`);

export const initViewSelect = (
    selected: GeopoliticalView,
    onChange: (view: GeopoliticalView | undefined) => void,
): void => {
    viewSelect.append(
        new Option('Default for your country', ''),
        ...geopoliticalViews.map((view) => new Option(viewLabel(view), view)),
    );
    viewSelect.value = selected;
    viewSelect.addEventListener('change', () => onChange(geopoliticalViews.find((view) => view === viewSelect.value)));
};
