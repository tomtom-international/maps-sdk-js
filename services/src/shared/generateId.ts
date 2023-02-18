/**
 * Generate random Id
 * @ignore
 */
export const generateId = () => crypto.getRandomValues(new Uint32Array(3)).join("-");
