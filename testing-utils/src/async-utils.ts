export const tryBeforeTimeout = <T>(func: () => Promise<T>, errorMsg: string, timeoutMs: number): Promise<T> =>
    Promise.race<T>([func(), new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), timeoutMs))]);

export const waitForTimeout = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
