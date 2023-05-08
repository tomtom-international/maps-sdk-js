/**
 * Calls the given function to measure for "numCalls" times, and returns the best (smallest) measurement.
 * @ignore
 */
export const bestExecutionTimeMS = (functionToMeasure: () => unknown, numCalls: number): number => {
    const timeTakenToExec: number[] = [];
    for (let i = 0; i < numCalls; i++) {
        const start = performance.now();
        functionToMeasure();
        timeTakenToExec.push(performance.now() - start);
    }
    return Math.min(...timeTakenToExec);
};
