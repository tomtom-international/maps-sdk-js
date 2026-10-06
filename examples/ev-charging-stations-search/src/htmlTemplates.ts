import type { ChargingPark, ChargingPoint } from '@tomtom-org/maps-sdk/core';
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

export const connectorsHTML = (chargingPark: ChargingPark): string => {
    const rows = chargingPark.connectors
        .map(
            ({ connector, count }) => `
    <li class="ui-connector-li">
        <span class="ui-connector-icon">${connectorIcons[connector.type] ?? genericIcon}</span>
        <span class="ui-connector-name">${escapeHtml(connectorNames[connector.type] ?? connector.type)}</span>
        <span class="ui-connector-sublabel">
            <span class="ui-connector-power">${connector.ratedPowerKW} kW</span>
            <span class="ui-connector-count">${count}</span>
        </span>
    </li>`,
        )
        .join('');
    return `<h4 class="ui-popup-subtitle">Connectors</h4><ul class="ui-connector-ul">${rows}</ul>`;
};

const chargingPointRow = (label: string, point: ChargingPoint): string => {
    const plugs = (point.connectors ?? [])
        .map(
            ({ type }) =>
                `<span class="ui-connector-icon" title="${escapeHtml(connectorNames[type] ?? type)}">${connectorIcons[type] ?? genericIcon}</span>`,
        )
        .join('');
    return `
    <li class="ui-connector-li">
        <span class="ui-connector-name ui-charging-point-label">${escapeHtml(label)}</span>
        <span class="ui-charging-point-plugs">${plugs}</span>
    </li>`;
};

export const chargingPointsHTML = (chargingPark: ChargingPark): string => {
    const rows = (chargingPark.chargingStations ?? []).flatMap((station) =>
        station.chargingPoints.map((point) => chargingPointRow(point.evseId ?? station.id, point)),
    );
    return rows.length
        ? `<h4 class="ui-popup-subtitle">Charging points</h4><ul class="ui-connector-ul">${rows.join('')}</ul>`
        : '';
};
