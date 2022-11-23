export const assertExecutionTime = (functionToTest: () => any, numIterations: number, maxExecutionTime: number) => {
    const timeTakenToExec: number[] = [];
    for (let i = 0; i < numIterations; i++) {
        const start = performance.now();
        functionToTest();
        timeTakenToExec.push(performance.now() - start);
    }
    //smallest value is considered
    return Math.min(...timeTakenToExec) < maxExecutionTime;
};
