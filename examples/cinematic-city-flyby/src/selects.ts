/** Consecutive options of the same group go under one heading. */
export const fillSelect = (
    id: string,
    options: { label: string; group?: string }[],
    onPick: (index: number) => void,
) => {
    const select = document.querySelector(id) as HTMLSelectElement;
    let parent: HTMLElement = select;
    options.forEach(({ label, group }, index) => {
        if (group && group !== options[index - 1]?.group) {
            parent = select.appendChild(Object.assign(document.createElement('optgroup'), { label: group }));
        }
        parent.appendChild(new Option(label, String(index)));
    });
    select.addEventListener('change', () => onPick(Number(select.value)));
};
