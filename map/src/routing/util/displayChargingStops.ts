import { ChargingStop, ChargingStopProps, formatDuration, generateId, type Place, type Routes } from 'core';
import { FeatureCollection, Point } from 'geojson';
import { PlaceDisplayProps } from '../../places';
import type { DisplayRouteProps, RouteStateProps } from '../types/displayRoutes';
import { RoutingModuleConfig } from '../types/routeModuleConfig';

const getIconID = (chargingStop: ChargingStop, config: RoutingModuleConfig | undefined): string => {
    const iconConfig = config?.chargingStops?.icon;
    if (iconConfig?.mapping) {
        const mapping = iconConfig.mapping;
        switch (mapping.basedOn) {
            case 'chargingSpeed':
                if (chargingStop.properties.chargingConnectionInfo?.chargingSpeed) {
                    return mapping.value[chargingStop.properties.chargingConnectionInfo?.chargingSpeed];
                }
                break;
            case 'custom':
                return mapping.fn(chargingStop);
        }
    }

    // default: (genesis-like) categorySet ID for "EV Charging Station" based on search
    return '7309';
};

const formatTitle = (chargingStop: ChargingStop): string => {
    const properties = chargingStop.properties;
    return properties.chargingParkName ?? (properties.chargingParkOperatorName as string);
};

type DisplayChargingStopProps = PlaceDisplayProps &
    ChargingStopProps &
    RouteStateProps & {
        chargingDuration: string;
        chargingPower: string;
    };

type DisplayChargingStops = FeatureCollection<Point, DisplayChargingStopProps>;

/**
 * Generates display-ready charging stations for the given planning context ones.
 * @param routes The routes return for ldEV.
 * @param config The charging stops display configuration.
 * @see chargingStopLayers
 * @ignore
 */
export const toDisplayChargingStops = (
    routes: Routes<DisplayRouteProps>,
    config: RoutingModuleConfig | undefined,
): DisplayChargingStops => {
    const displayChargingStops: Place<DisplayChargingStopProps>[] = [];

    if (config?.chargingStops?.visible !== false) {
        for (const route of routes.features) {
            for (const leg of route.properties.sections.leg) {
                const chargingStop = leg.summary.chargingInformationAtEndOfLeg;

                if (chargingStop) {
                    const properties = chargingStop.properties;
                    displayChargingStops.push({
                        ...chargingStop,
                        properties: {
                            ...chargingStop.properties,
                            id: chargingStop.properties.chargingParkId ?? generateId(),
                            iconID: getIconID(chargingStop, config),
                            title: formatTitle(chargingStop),
                            chargingPower: `${properties.chargingConnectionInfo?.chargingPowerInkW} kW`,
                            chargingDuration: formatDuration(
                                properties.chargingTimeInSeconds,
                                config?.displayUnits?.time,
                            ) as string,
                            routeState: route.properties.routeState,
                        },
                    });
                }
            }
        }
    }
    return { type: 'FeatureCollection', features: displayChargingStops };
};
