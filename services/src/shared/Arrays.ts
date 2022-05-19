export const arrayToCSV = (input: unknown | unknown[]): string =>
    !input ? "" : Array.isArray(input) ? input.join(",") : typeof input == "string" ? input : String(input);
