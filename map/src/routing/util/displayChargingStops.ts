import {
    ChargingStop,
    ChargingStopProps,
    formatDuration,
    generateId,
    type Place,
    type Routes,
} from '@tomtom-org/maps-sdk/core';
import { FeatureCollection, Point } from 'geojson';
import { PlaceDisplayProps } from '../../places';
import { toPinSpriteImageID } from '../../shared/imageUtils';
import type { DisplayRouteProps, DisplayRouteRelatedProps } from '../types/displayRoutes';
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
    return toPinSpriteImageID('7309');
};

const formatTitle = (chargingStop: ChargingStop): string => {
    const properties = chargingStop.properties;
    return properties.chargingParkName ?? (properties.chargingParkOperatorName as string);
};

type DisplayChargingStopProps = PlaceDisplayProps &
    ChargingStopProps &
    DisplayRouteRelatedProps & {
        chargingDuration: string;
        chargingPower: string;
        stopDuration?: string;
    };

/**
 * The charging stops as displayed on the map, carrying the route state and index so a selection
 * change can restyle them in place.
 * @ignore
 */
export type DisplayChargingStops = FeatureCollection<Point, DisplayChargingStopProps>;

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
                    // The whole time at this stop, which is the charging plus any wait the caller
                    // asked for at the same place. The two are one gap in the response, so the pin
                    // shows the total and `chargingDuration` stays available for a label that wants
                    // only the charging part.
                    const stopDuration = formatDuration(
                        leg.summary.stopTimeInSeconds ?? properties.chargingTimeInSeconds,
                        config?.displayUnits?.time,
                    );
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
                            ...(stopDuration && { stopDuration }),
                            routeState: route.properties.routeState,
                            // Carrying the route index is what lets `selectRoute` restyle these
                            // rather than regenerate the whole collection.
                            routeIndex: route.properties.index,
                        },
                    });
                }
            }
        }
    }
    return { type: 'FeatureCollection', features: displayChargingStops };
};
