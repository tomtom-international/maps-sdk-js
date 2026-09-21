import type { GeographyType, View } from '@tomtom-org/maps-sdk/core';
import { geographyTypes, views } from '@tomtom-org/maps-sdk/core';
import type { ReverseGeocodingOptionalParams } from '@tomtom-org/maps-sdk/services';
import { element } from './dom';

const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

const radiusSlider = element<HTMLInputElement>('#ui-radiusSlider');
const radiusValue = element<HTMLElement>('#ui-radiusValue');
const headingToggle = element<HTMLInputElement>('#ui-headingToggle');
const headingSlider = element<HTMLInputElement>('#ui-headingSlider');
const headingValue = element<HTMLElement>('#ui-headingValue');
const headingArrow = element<SVGPathElement>('#ui-headingArrow');
const headingNote = element<HTMLElement>('#ui-headingNote');
const viewSelect = element<HTMLSelectElement>('#ui-viewSelect');
const areaTypeList = element<HTMLElement>('#ui-areaTypes');

const readableName = (geographyType: GeographyType): string => geographyType.replace(/([a-z])([A-Z])/g, '$1 $2');

const compassPoint = (degrees: number): string => COMPASS_POINTS[Math.round(degrees / 45) % COMPASS_POINTS.length];

// `views` and `geographyTypes` are the SDK's own vocabularies, so the panel cannot offer a value
// the service does not know.
const fillControls = (): void => {
    viewSelect.innerHTML = views.map((view) => `<option value="${view}">${view}</option>`).join('');

    areaTypeList.innerHTML = geographyTypes
        .map(
            (geographyType) => `<label class="ui-checkbox-label">
                <input type="checkbox" value="${geographyType}">
                <span>${readableName(geographyType)}</span>
            </label>`,
        )
        .join('');
};

const selectedAreaTypes = (): GeographyType[] =>
    [...areaTypeList.querySelectorAll<HTMLInputElement>('input:checked')].map(
        (checkbox) => checkbox.value as GeographyType,
    );

const syncRadiusReadout = (): void => {
    const radiusMeters = Number(radiusSlider.value);
    radiusValue.textContent = radiusMeters > 0 ? `${radiusMeters} m` : 'any';
};

// `heading` counts clockwise from north, as an SVG rotation does, so the degrees go straight on.
const syncHeadingReadout = (): void => {
    const degrees = Number(headingSlider.value);
    headingValue.textContent = `${degrees}° ${compassPoint(degrees)}`;
    headingArrow.setAttribute('transform', `rotate(${degrees} 18 18)`);
};

// The service ignores `heading` as soon as `geographyType` is set.
const syncHeadingAvailability = (): void => {
    const narrowedToAreas = selectedAreaTypes().length > 0;
    headingToggle.disabled = narrowedToAreas;
    headingSlider.disabled = narrowedToAreas || !headingToggle.checked;
    headingNote.hidden = !narrowedToAreas;
};

export const readOptions = (): ReverseGeocodingOptionalParams => {
    const radiusMeters = Number(radiusSlider.value);
    const geographyType = selectedAreaTypes();

    return {
        ...(radiusMeters > 0 && { radiusMeters }),
        ...(geographyType.length > 0 && { geographyType }),
        ...(!headingSlider.disabled && { heading: Number(headingSlider.value) }),
        view: viewSelect.value as View,
    };
};

export const initOptionsPanel = (onOptionsChange: () => void): void => {
    fillControls();
    syncRadiusReadout();
    syncHeadingReadout();
    syncHeadingAvailability();

    // `input` tracks the drag; `change` fires on release, so a drag costs one request.
    radiusSlider.addEventListener('input', syncRadiusReadout);
    radiusSlider.addEventListener('change', onOptionsChange);

    headingSlider.addEventListener('input', syncHeadingReadout);
    headingSlider.addEventListener('change', onOptionsChange);

    headingToggle.addEventListener('change', () => {
        syncHeadingAvailability();
        onOptionsChange();
    });

    viewSelect.addEventListener('change', onOptionsChange);

    areaTypeList.addEventListener('change', () => {
        syncHeadingAvailability();
        onOptionsChange();
    });
};
