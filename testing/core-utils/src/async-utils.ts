export const tryBeforeTimeout = <T>(operation: () => Promise<T>, errorMessage: string, timeoutMs: number): Promise<T> =>
    Promise.race<T>([
        operation(),
        new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs)),
    ]);

export const waitForTimeout = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
