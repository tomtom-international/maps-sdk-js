import type { Map as MapLibreMap } from 'maplibre-gl';
import type { EvalGlobalThis, EvalWindowModuleGetters } from './types';

type EvalWindowHooksOptions = EvalWindowModuleGetters & {
    enabled: boolean;
    mapLibreMap: MapLibreMap;
    sendMessage: (query: string) => void;
    reset: () => void;
};

export const setupEvalWindowHooks = (options: EvalWindowHooksOptions): void => {
    if (!options.enabled) {
        return;
    }

    const evalWindow = globalThis as EvalGlobalThis;
    evalWindow.mapLibreMap = options.mapLibreMap;
    evalWindow.__evalSendMessage = (query: string) => {
        options.sendMessage(query);
    };
    evalWindow.__evalReset = options.reset;
    evalWindow.getBaseMapModule = options.getBaseMapModule;
    evalWindow.getGeometriesModule = options.getGeometriesModule;
    evalWindow.getHillshadeModule = options.getHillshadeModule;
    evalWindow.getPlacesModule = options.getPlacesModule;
    evalWindow.getPOIsModule = options.getPOIsModule;
    evalWindow.getRoutingModule = options.getRoutingModule;
    evalWindow.getTrafficFlowModule = options.getTrafficFlowModule;
    evalWindow.getTrafficIncidentsModule = options.getTrafficIncidentsModule;
};
