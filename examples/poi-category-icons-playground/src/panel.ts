import {
    type CategoryStyle,
    categories,
    type IconLook,
    iconLooks,
    lookLabel,
    type PanelCategory,
    toCategoryImage,
} from './categoryIcons';

const buildCategoryRow = (category: PanelCategory, onChange: (style: CategoryStyle) => void): HTMLElement => {
    const row = document.createElement('div');
    row.className = 'category-row';

    // The very image the map draws the category with
    const preview = document.createElement('img');
    preview.className = 'category-preview';
    preview.alt = '';

    const name = document.createElement('span');
    name.className = 'ui-label';
    name.textContent = category.label;

    const lookSelect = document.createElement('select');
    lookSelect.className = 'ui-dropdown';
    lookSelect.setAttribute('aria-label', `${category.label} icon`);
    for (const look of iconLooks) {
        lookSelect.add(new Option(lookLabel(look), look, false, look === category.initialStyle.look));
    }

    const swatch = document.createElement('span');
    swatch.className = 'ui-color-swatch';
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = category.initialStyle.color;
    colorPicker.setAttribute('aria-label', `${category.label} colour`);
    swatch.append(colorPicker);

    const showStyle = (style: CategoryStyle) => {
        const image = toCategoryImage(category, style);
        preview.src = image ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(image)}` : '';
        preview.style.visibility = image ? 'visible' : 'hidden';
        colorPicker.disabled = style.look === 'map';
    };
    const emitChange = () => {
        const style = { look: lookSelect.value as IconLook, color: colorPicker.value };
        showStyle(style);
        onChange(style);
    };
    lookSelect.addEventListener('change', emitChange);
    colorPicker.addEventListener('input', emitChange);
    showStyle(category.initialStyle);

    row.append(preview, name, lookSelect, swatch);
    return row;
};

/**
 * Builds a row per category, calling `onChange` with the category and its new style whenever one is edited.
 */
export const initCategoryRows = (onChange: (category: PanelCategory, style: CategoryStyle) => void): void => {
    const container = document.getElementById('category-rows') as HTMLDivElement;
    container.append(...categories.map((category) => buildCategoryRow(category, (style) => onChange(category, style))));
};
