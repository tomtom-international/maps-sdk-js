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

export const escapeHtml = (value: string): string =>
    value.replaceAll(
        /[&<>"']/g,
        (ch) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[ch] as string,
    );

export const connectorsHTML = (chargingPark: ChargingPark | ChargingParkWithAvailability): string => {
    const hasAvailability = hasChargingAvailability(chargingPark);
    const connectorsListHTML = hasAvailability
        ? renderConnectorsWithAvailability(chargingPark.availability.connectorAvailabilities)
        : renderConnectors(chargingPark.connectors);

    return `<ul class="sdk-example-connector-ul">${connectorsListHTML}</ul>`;
};

const connectorRow = ({
    icon,
    name,
    power,
    count,
    statusClass,
}: {
    icon: string;
    name: string;
    power: string;
    count: string;
    statusClass: 'available' | 'unavailable' | 'unknown';
}): string => `
    <li class="sdk-example-connector-li">
        <span class="sdk-example-connector-icon">${icon}</span>
        <span class="sdk-example-connector-name">${escapeHtml(name)}</span>
        <span class="sdk-example-connector-sublabel">
            <span class="sdk-example-connector-power">${escapeHtml(power)}</span>
            <span class="sdk-example-connector-availability-cell">
                <span class="sdk-example-connector-availability sdk-example-availability-${statusClass}">${escapeHtml(count)}</span>
                <span class="sdk-example-status-dot sdk-example-status-dot-${statusClass}"></span>
            </span>
        </span>
    </li>`;

const renderConnectorsWithAvailability = (connectorAvailabilities: ConnectorAvailability[]): string =>
    connectorAvailabilities
        .map((connectorAvailability) => {
            const connector = connectorAvailability.connector;
            const connectorType = connector.type;
            const availableCount = connectorAvailability.statusCounts.Available ?? 0;
            const totalCount = connectorAvailability.count;
            return connectorRow({
                icon: connectorIcons[connectorType] ?? genericIcon,
                name: connectorNames[connectorType] ?? connectorType,
                power: `${connector.ratedPowerKW} kW`,
                count: `${availableCount}/${totalCount}`,
                statusClass: availableCount > 0 ? 'available' : 'unavailable',
            });
        })
        .join('');

const renderConnectors = (connectors: ConnectorCount[]): string =>
    connectors
        .map((item) => {
            const connector = item.connector;
            const connectorType = connector.type;
            return connectorRow({
                icon: connectorIcons[connectorType] ?? genericIcon,
                name: connectorNames[connectorType] ?? connectorType,
                power: `${connector.ratedPowerKW} kW`,
                count: `${item.count}`,
                statusClass: 'unknown',
            });
        })
        .join('');
