import type { RouteHighlightConfig, RouteWaypointSize, RouteWidth, RoutingKnobId } from '@tomtom-org/maps-sdk/map';
import { knobEntryOf, routingKnobCatalogue } from '@tomtom-org/maps-sdk/map';

export type RoutePlaygroundState = {
    visible: boolean;
    color: string | undefined;
    // Unset follows the map's light/dark theme.
    waypointLabelColor: string | undefined;
    width: RouteWidth;
    widthFactor: number;
    waypointSize: RouteWaypointSize;
    waypointSizeFactor: number;
    centerDash: boolean;
    routeOpacity: number;
    // Unset factors keep the SDK's own, which the sliders start at.
    highlight: Required<RouteHighlightConfig>;
};

// The slider spans the range the SDK clamps the factor to.
// The catalogue entry carries the knob's range, and the factor the SDK draws when it is unset.
const initFactorSlider = (
    id: string,
    knobId: RoutingKnobId,
    initial: number | undefined,
    onChange: (factor: number) => void,
): void => {
    const { range, default: sdkDefault } = knobEntryOf(routingKnobCatalogue, knobId);
    if (!range) return;

    const slider = document.getElementById(id) as HTMLInputElement;
    const valueLabel = document.getElementById(`${id}-value`) as HTMLElement;
    slider.min = String(range.min);
    slider.max = String(range.max);
    slider.step = String(range.step);
    slider.value = String(initial ?? sdkDefault ?? range.min);
    valueLabel.textContent = `${slider.value}×`;
    slider.addEventListener('input', () => {
        valueLabel.textContent = `${slider.value}×`;
        onChange(Number(slider.value));
    });
};

export const initControls = (
    state: RoutePlaygroundState,
    apply: () => void,
    setVisible: (visible: boolean) => void,
    setClicked: (clicked: boolean) => void,
): void => {
    // Panel toggle
    const toggleButton = document.querySelector('.ui-heading-toggle')!;
    const panelContent = document.querySelector('.ui-panel-content')!;
    toggleButton.addEventListener('click', () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        panelContent.classList.toggle('collapsed');
    });

    // Hides the route and its pins, keeping them for when it is shown again
    const visibleToggle = document.querySelector<HTMLInputElement>('#toggle-route-visible');
    visibleToggle?.addEventListener('change', () => {
        state.visible = visibleToggle.checked;
        setVisible(state.visible);
    });

    // Route color picker
    const colorPicker = document.getElementById('routeColor-picker') as HTMLInputElement;
    colorPicker?.addEventListener('input', () => {
        state.color = colorPicker.value;
        apply();
    });

    const waypointLabelColorPicker = document.getElementById('waypointLabelColor-picker') as HTMLInputElement;
    waypointLabelColorPicker?.addEventListener('input', () => {
        state.waypointLabelColor = waypointLabelColorPicker.value;
        apply();
    });

    // Route width radios
    document.querySelectorAll<HTMLInputElement>('input[name="width"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            state.width = radio.value as RouteWidth;
            apply();
        });
    });

    initFactorSlider('width-factor', 'widthFactor', state.widthFactor, (factor) => {
        state.widthFactor = factor;
        apply();
    });

    // Waypoint size radios
    document.querySelectorAll<HTMLInputElement>('input[name="waypointSize"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            state.waypointSize = radio.value as RouteWaypointSize;
            apply();
        });
    });

    initFactorSlider('waypoint-size-factor', 'waypoints.sizeFactor', state.waypointSizeFactor, (factor) => {
        state.waypointSizeFactor = factor;
        apply();
    });

    // Center dash toggle
    document.getElementById('toggle-center-dash')?.addEventListener('change', (e) => {
        state.centerDash = (e.target as HTMLInputElement).checked;
        apply();
    });

    // Draws the route as if clicked, so the clicked outline factor shows
    const clickedToggle = document.querySelector<HTMLInputElement>('#toggle-clicked');
    clickedToggle?.addEventListener('change', () => setClicked(clickedToggle.checked));

    initFactorSlider('highlight-outline-width-factor', 'highlight.outline.widthFactor', undefined, (factor) => {
        state.highlight.outline.widthFactor = factor;
        apply();
    });

    // Route opacity slider
    const opacitySlider = document.getElementById('route-opacity') as HTMLInputElement;
    const opacityValue = document.getElementById('route-opacity-value') as HTMLElement;
    opacitySlider?.addEventListener('input', () => {
        const pct = Number(opacitySlider.value);
        opacityValue.textContent = `${pct}%`;
        state.routeOpacity = pct / 100;
        apply();
    });
};
