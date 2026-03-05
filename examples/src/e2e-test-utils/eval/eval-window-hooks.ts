import type { Map as MapLibreMap } from 'maplibre-gl';
import type { EvalWindow } from './types';

type EvalWindowHooksOptions = {
    enabled: boolean;
    mapLibreMap: MapLibreMap;
    sendMessage: (query: string) => void;
    reset: () => void;
};

export const setupEvalWindowHooks = (options: EvalWindowHooksOptions): void => {
    if (!options.enabled) {
        return;
    }

    const evalWindow = globalThis as unknown as Partial<EvalWindow>;
    evalWindow.mapLibreMap = options.mapLibreMap;
    evalWindow.__evalSendMessage = (query: string) => {
        options.sendMessage(query);
    };
    evalWindow.__evalReset = options.reset;
};
