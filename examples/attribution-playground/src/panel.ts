import { type AttributionPosition, type StandardStyleID, standardStyleIDs } from '@tomtom-org/maps-sdk/map';

/** What the panel asks for, every option spelled out. */
export type PanelAttribution = {
    position: AttributionPosition;
    padding: { horizontal: number; vertical: number };
    credits: string[];
    backdrop: boolean;
};

const element = <T extends Element>(selector: string): T => {
    const found = document.querySelector<T>(selector);
    if (!found) throw new Error(`Missing element: ${selector}`);
    return found;
};

const checkedValue = (name: string): string => element<HTMLInputElement>(`input[name="${name}"]:checked`).value;

const styleSelect = element<HTMLSelectElement>('#ui-style');
const horizontal = element<HTMLInputElement>('#ui-horizontal');
const vertical = element<HTMLInputElement>('#ui-vertical');
const creditToggle = element<HTMLInputElement>('#ui-credit-toggle');
const credit = element<HTMLInputElement>('#ui-credit');
const backdropToggle = element<HTMLInputElement>('#ui-backdrop');
const sheetToggle = element<HTMLInputElement>('#ui-sheet');
const bottomSheet = element<HTMLElement>('#ui-bottom-sheet');

// How far a bottom corner's attribution has to rise to clear the sheet: padding is measured from
// the map's edge, so the sheet's height goes on top of what the slider says.
const sheetHeight = (): number =>
    sheetToggle.checked && checkedValue('ui-position').startsWith('bottom') ? bottomSheet.offsetHeight : 0;

const readAttribution = (): PanelAttribution => {
    const creditText = credit.value.trim();

    return {
        position: checkedValue('ui-position') as AttributionPosition,
        padding: { horizontal: horizontal.valueAsNumber, vertical: vertical.valueAsNumber + sheetHeight() },
        credits: creditToggle.checked && creditText ? [creditText] : [],
        backdrop: backdropToggle.checked,
    };
};

const showSliderValues = (): void => {
    element('#ui-horizontal-value').textContent = `${horizontal.value}px`;
    element('#ui-vertical-value').textContent = `${vertical.value}px`;
};

/**
 * Calls `onAttributionChange` with the panel's `attribution` now, and again each time it changes, with
 * the part of its vertical padding that clears the bottom sheet; and `onStyleChange` with each style picked.
 */
export const initPanel = (
    onAttributionChange: (attribution: PanelAttribution, sheetHeight: number) => void,
    onStyleChange: (style: StandardStyleID) => void,
): void => {
    let shown: string | undefined;
    const update = (event?: Event): void => {
        if (event?.target === styleSelect) {
            onStyleChange(styleSelect.value as StandardStyleID);
            return;
        }

        bottomSheet.hidden = !sheetToggle.checked;
        credit.disabled = !creditToggle.checked;
        const attribution = readAttribution();
        const key = JSON.stringify(attribution);
        if (key !== shown) {
            shown = key;
            onAttributionChange(attribution, sheetHeight());
        }
    };

    // A slider rebuilds the map once it is let go, not on every step of the drag.
    horizontal.addEventListener('input', showSliderValues);
    vertical.addEventListener('input', showSliderValues);
    document.querySelector('.ui-customPanel')?.addEventListener('change', update);

    for (const id of standardStyleIDs) styleSelect.add(new Option(id));
    showSliderValues();
    update();
};
