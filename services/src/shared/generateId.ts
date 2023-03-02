/**
 * Generate random Id
 * @ignore
 */
export const generateId = (): string => crypto.getRandomValues(new Uint32Array(3)).join("-");
