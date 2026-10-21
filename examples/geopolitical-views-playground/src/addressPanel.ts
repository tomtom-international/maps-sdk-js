import type { RevGeoAddressProps } from '@tomtom-org/maps-sdk/core';

const addressList = document.querySelector('#ui-address') as HTMLElement;
const statusText = document.querySelector('#ui-status') as HTMLElement;

export const showAddress = ({ address }: RevGeoAddressProps, viewLabel: string): void => {
    addressList.innerHTML = [
        ['View', viewLabel],
        ['Country', address.country ?? 'none'],
        ['Address', address.freeformAddress],
    ]
        .map(([label, value]) => `<dt class="ui-summary-label">${label}</dt><dd class="ui-summary-value">${value}</dd>`)
        .join('');
    statusText.textContent = '';
};

export const showStatus = (message: string): void => {
    addressList.innerHTML = '';
    statusText.textContent = message;
};
