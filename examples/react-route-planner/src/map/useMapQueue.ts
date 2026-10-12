import { useCallback, useRef } from 'react';

/**
 * Runs map updates one after another, so an older one never lands over a newer one. A failed update
 * rejects the promise it returns and leaves the queue running.
 */
export const useMapQueue = () => {
    const queue = useRef(Promise.resolve());
    return useCallback(<Result>(update: () => Promise<Result>): Promise<Result> => {
        const run = queue.current.then(update);
        queue.current = run.then(
            () => undefined,
            () => undefined,
        );
        return run;
    }, []);
};
