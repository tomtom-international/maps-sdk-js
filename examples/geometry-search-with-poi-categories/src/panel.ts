import { type CategorySearch, categoryWords } from './categoryWords';

const element = <T extends Element>(selector: string): T => {
    const found = document.querySelector<T>(selector);
    if (!found) throw new Error(`Missing element: ${selector}`);

    return found;
};

const form = element<HTMLFormElement>('#ui-categoryForm');
const languageSelect = element<HTMLSelectElement>('#ui-languageSelect');
const categoryInput = element<HTMLInputElement>('#ui-categoryInput');
const status = element<HTMLElement>('#ui-status');

const selectedCategoryWord = () => categoryWords[languageSelect.selectedIndex];

export const readSearch = (): CategorySearch => ({
    poiCategoryQuery: categoryInput.value.trim(),
    language: selectedCategoryWord().language,
});

export const showStatus = (message: string): void => {
    status.textContent = message;
};

export const initPanel = (onSearch: (search: CategorySearch) => void): void => {
    languageSelect.append(...categoryWords.map(({ language, name }) => new Option(name, language)));
    categoryInput.value = selectedCategoryWord().poiCategoryQuery;

    languageSelect.addEventListener('change', () => {
        categoryInput.value = selectedCategoryWord().poiCategoryQuery;
        onSearch(readSearch());
    });
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        onSearch(readSearch());
    });
};
