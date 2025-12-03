/**
 * Generate random id for map features
 * @ignore
 */
export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
