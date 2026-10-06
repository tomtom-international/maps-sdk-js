export const element = <T extends Element>(selector: string): T => {
    const found = document.querySelector<T>(selector);
    if (!found) throw new Error(`Missing element: ${selector}`);

    return found;
};
