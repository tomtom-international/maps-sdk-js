import {
    ChargingPark,
    ChargingParkWithAvailability,
    ConnectorAvailability,
    ConnectorCount,
} from '@tomtom-org/maps-sdk/core';
import { hasChargingAvailability } from '@tomtom-org/maps-sdk/services';
import { connectorIcons } from './connectorIcons';
import { connectorNames } from './connectorNames';
import genericIcon from './ic-generic-24.svg?raw';

export const connectorsHTML = (chargingPark: ChargingPark | ChargingParkWithAvailability): string => {
    const hasAvailability = hasChargingAvailability(chargingPark);
    const connectorsListHTML = hasAvailability
        ? renderConnectorsWithAvailability(chargingPark.availability.connectorAvailabilities)
        : renderConnectors(chargingPark.connectors);

    return `<ul class="sdk-example-connector-ul">${connectorsListHTML}</ul>`;
};

const renderConnectorsWithAvailability = (connectorAvailabilities: ConnectorAvailability[]): string => {
    return connectorAvailabilities
        .map((connectorAvailability) => {
            const connector = connectorAvailability.connector;
            const connectorType = connector.type;
            const connectorName = connectorNames[connectorType] ?? connectorType;
            const availableCount = connectorAvailability.statusCounts.Available ?? 0;

            return `
                <li class="sdk-example-connector-li">
                    <div class="sdk-example-connector-icon">${connectorIcons[connectorType] ?? genericIcon}</div>
                    <span class="sdk-example-connector-name">${connectorName ?? ''}</span>
                    <span class="sdk-example-connector-power"> | ${connector.ratedPowerKW} KW</span>
                    <span class="${
                        availableCount ? 'sdk-example-available' : 'sdk-example-unavailable'
                    }">${availableCount} / ${connectorAvailability.count}</span>
                </li>`;
        })
        .join('');
};

const renderConnectors = (connectors: ConnectorCount[]): string => {
    return connectors
        .map((item) => {
            const connector = item.connector;
            const count = item.count;
            const connectorType = connector.type;
            const connectorName = connectorNames[connectorType] ?? connectorType;

            return `
                <li class="sdk-example-connector-li">
                    <div class="sdk-example-connector-icon">${connectorIcons[connectorType] ?? genericIcon}</div>
                    <span class="sdk-example-connector-name">${connectorName ?? ''}</span>
                    <span class="sdk-example-connector-power"> | ${connector.ratedPowerKW} KW</span>
                    <span class="sdk-example-no-status">${count}</span>
                </li>`;
        })
        .join('');
};
