import type { Avoidable } from '@tomtom-org/maps-sdk/core';
import { formatDistance, formatDuration } from '@tomtom-org/maps-sdk/core';
import type { LegCostModel, RouteType } from '@tomtom-org/maps-sdk/services';

const ROUTE_TYPE_LABELS: [RouteType | '', string][] = [
    ['', 'Route default'],
    ['fast', 'Fastest'],
    ['short', 'Shortest'],
    ['efficient', 'Most efficient'],
    ['thrilling', 'Thrilling'],
];

// Phrased as "no ..." so each checkbox reads on its own, without a caption above the grid.
const AVOID_LABELS: [Avoidable, string][] = [
    ['motorways', 'No motorways'],
    ['tollRoads', 'No tolls'],
    ['ferries', 'No ferries'],
    ['unpavedRoads', 'No unpaved'],
];

const routeTypeLabel = (routeType: RouteType | ''): string =>
    ROUTE_TYPE_LABELS.find(([value]) => value === routeType)?.[1] ?? '';

const avoidLabel = (avoidable: Avoidable): string =>
    AVOID_LABELS.find(([value]) => value === avoidable)?.[1] ?? avoidable;

export type LegStats = {
    lengthInMeters: number;
    travelTimeInSeconds: number;
    /** Time spent at the stop this leg arrives at, absent when it does not stop. */
    stopTimeInSeconds?: number;
};

export type LegPanel = {
    /** One cost model per leg, in leg order, ready to attach to the arriving stops. */
    readonly costModels: LegCostModel[];
    /** Refreshes the distance and time shown for each leg. */
    setStats: (stats: LegStats[]) => void;
    setBusy: (busy: boolean) => void;
};

const buildLegSection = (legIndex: number, from: string, to: string): HTMLElement => {
    const section = document.createElement('div');
    section.className = 'ui-leg';
    section.innerHTML = `
        <h4 class="ui-leg-heading" data-testid="leg-heading-${legIndex}">
            <span class="ui-leg-headings">
                <span class="ui-leg-title">${from} → ${to}</span>
                <span class="ui-leg-stats" data-testid="leg-stats-${legIndex}"></span>
            </span>
            <button
                class="ui-heading-toggle"
                type="button"
                aria-expanded="true"
                aria-controls="ui-leg-body-${legIndex}"
                aria-label="Toggle options for the leg from ${from} to ${to}"
                data-testid="leg-toggle-${legIndex}"
            >
                <svg class="ui-heading-chevron" viewBox="0 0 16 10">
                    <path d="M3 1.5L8 6.5L13 1.5" />
                </svg>
            </button>
        </h4>
        <p class="ui-leg-choices" data-testid="leg-choices-${legIndex}"></p>
        <div class="ui-leg-body" id="ui-leg-body-${legIndex}">
            <select
                class="ui-dropdown"
                aria-label="Road preference for the leg from ${from} to ${to}"
                data-testid="leg-routetype-${legIndex}"
            >
                ${ROUTE_TYPE_LABELS.map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
            </select>
            <div class="ui-leg-avoids">
                ${AVOID_LABELS.map(
                    ([value, label]) => `
                    <label class="ui-checkbox-label">
                        <input type="checkbox" value="${value}" data-testid="leg-avoid-${legIndex}-${value}">
                        ${label}
                    </label>`,
                ).join('')}
            </div>
        </div>`;

    return section;
};

// The panel is built from the legs of a route that has already been calculated, so the number of
// legs and their endpoints come from the route rather than being assumed here.
export const buildLegPanel = (container: HTMLElement, legNames: [string, string][], onChange: () => void): LegPanel => {
    const costModels: LegCostModel[] = legNames.map(() => ({}));
    const statLabels: HTMLElement[] = [];
    const controls: (HTMLInputElement | HTMLSelectElement)[] = [];

    container.innerHTML = '';

    legNames.forEach(([from, to], legIndex) => {
        const section = buildLegSection(legIndex, from, to);
        container.appendChild(section);

        statLabels.push(section.querySelector('.ui-leg-stats') as HTMLElement);
        const heading = section.querySelector('.ui-leg-heading') as HTMLElement;
        const toggle = section.querySelector('.ui-heading-toggle') as HTMLButtonElement;
        const body = section.querySelector('.ui-leg-body') as HTMLElement;
        const choices = section.querySelector('.ui-leg-choices') as HTMLElement;
        const routeTypeSelect = section.querySelector('select') as HTMLSelectElement;
        const avoidBoxes = [...section.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
        controls.push(routeTypeSelect, ...avoidBoxes);

        // A collapsed leg still has to show what it is set to, otherwise folding it away hides the
        // very thing the panel is for.
        const renderChoices = (): void => {
            const routeType = routeTypeSelect.value as RouteType | '';
            const parts = [
                ...(routeType !== '' ? [routeTypeLabel(routeType)] : []),
                ...avoidBoxes.filter((box) => box.checked).map((box) => avoidLabel(box.value as Avoidable)),
            ];
            choices.textContent = parts.length > 0 ? parts.join(' · ') : 'Route default';
        };

        // Only the options actually set are kept, so an untouched leg falls back to the route-wide
        // cost model instead of being sent an explicit default.
        const collect = (): void => {
            const routeType = routeTypeSelect.value as RouteType | '';
            const avoid = avoidBoxes.filter((box) => box.checked).map((box) => box.value as Avoidable);
            costModels[legIndex] = {
                ...(routeType !== '' && { routeType }),
                ...(avoid.length > 0 && { avoid }),
            };
            renderChoices();
            onChange();
        };

        // The handler sits on the whole heading so the title is clickable too. A click on the button
        // bubbles up to here, so it toggles exactly once either way, and the button keeps the
        // keyboard and screen-reader behaviour.
        heading.addEventListener('click', () => {
            const expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            body.classList.toggle('collapsed', expanded);
            section.classList.toggle('ui-leg-collapsed', expanded);
        });

        routeTypeSelect.addEventListener('change', collect);
        for (const box of avoidBoxes) box.addEventListener('change', collect);

        renderChoices();
        // Only the first leg starts open: enough to show what the controls are without making the
        // panel taller than the map.
        if (legIndex > 0) heading.click();
    });

    return {
        costModels,
        setStats: (stats) => {
            stats.forEach((legStats, legIndex) => {
                const driving = formatDuration(legStats.travelTimeInSeconds) ?? '—';
                // A leg's travel time is driving only, so the stop at its end is shown next to it
                // rather than folded in.
                const stop = formatDuration(legStats.stopTimeInSeconds);
                const parts = [driving, formatDistance(legStats.lengthInMeters), ...(stop ? [`${stop} stop`] : [])];
                if (statLabels[legIndex]) statLabels[legIndex].textContent = parts.join(' · ');
            });
        },
        setBusy: (busy) => {
            for (const control of controls) control.disabled = busy;
        },
    };
};
