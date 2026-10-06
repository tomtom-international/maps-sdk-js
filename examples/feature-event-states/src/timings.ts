import type { TomTomMap } from '@tomtom-org/maps-sdk/map';

const bindSlider = (id: string, apply: (valueMS: number) => void) => {
    const slider = document.querySelector<HTMLInputElement>(`#${id}`);
    const output = slider?.nextElementSibling;
    if (!slider || !output) return;

    const update = () => {
        output.textContent = `${slider.value} ms`;
        apply(Number(slider.value));
    };
    slider.addEventListener('input', update);
    update();
};

export const initTimingSliders = (map: TomTomMap) => {
    bindSlider('ui-longHoverDelay', (longHoverDelayOnStillMapMS) =>
        map.updateEventsConfig({ longHoverDelayOnStillMapMS }),
    );
    bindSlider('ui-gracePeriod', (hoverGracePeriodMS) => map.updateEventsConfig({ hoverGracePeriodMS }));
};
