import type { RevGeoAddressProps } from '@tomtom-org/maps-sdk/core';
import { formatDistance } from '@tomtom-org/maps-sdk/core';
import type { Position } from 'geojson';
import { element } from './dom';

const resultList = element<HTMLElement>('#ui-result');
const statusText = element<HTMLElement>('#ui-status');

const formatPosition = (position: Position): string => `${position[0].toFixed(5)}, ${position[1].toFixed(5)}`;

const renderRows = (rows: (readonly [string, string])[]): void => {
    resultList.innerHTML = rows
        .map(([label, value]) => `<dt class="ui-summary-label">${label}</dt><dd class="ui-summary-value">${value}</dd>`)
        .join('');
};

export const showMatch = (match: RevGeoAddressProps, offsetMeters: number): void => {
    renderRows([
        ['Address', match.address.freeformAddress ?? '—'],
        ['Type', match.type],
        ...(match.geographyType ? [['Area type', match.geographyType.join(', ')] as const] : []),
        // `formatDistance` prints anything under 10 m verbatim, decimals and all.
        ['Offset', formatDistance(Math.round(offsetMeters))],
        ['Matched at', formatPosition(match.originalPosition)],
        ...(match.entryPoints?.length ? [['Entry points', String(match.entryPoints.length)] as const] : []),
    ]);
    statusText.textContent = '';
};

export const showNoMatch = (): void => {
    renderRows([]);
    statusText.textContent = 'Nothing addressable within the search radius. Widen it, or click somewhere else.';
};

export const showError = (error: unknown): void => {
    renderRows([]);
    statusText.textContent = error instanceof Error ? error.message : 'The reverse geocoding call failed.';
};
