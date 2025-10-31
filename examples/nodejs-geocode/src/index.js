'use strict';
require('dotenv').config({ path: '../.env' });

const geocode = require('@tomtom-org/maps-sdk/services').geocode;
const TomTomConfig = require('@tomtom-org/maps-sdk/core').TomTomConfig;

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

geocode({ query: 'Reckhammerweg Essen' }).then((response) =>
    console.log('Example for 1 specific result:\n', JSON.stringify(response, null, 4)),
);

geocode({ query: 'Rue Pepin' }).then((response) =>
    console.log('Example for multiple results returned:\n', JSON.stringify(response, null, 4)),
);

geocode({ query: 'amsterdam' }).then((response) => {
    console.log(JSON.stringify(response, null, 4));
    console.log('Results count', response.features?.length);
});

geocode({ query: 'amsterdam', limit: 5 }).then((response) => {
    console.log('Results count with limit specified', response.features?.length);
});

geocode({
    query: 'amsterdam',
    limit: 50,
    geographyTypes: ['Municipality'],
}).then((response) => {
    console.log('Results count with big limit specified and strict filter', response.features?.length);
});

geocode({
    query: 'amsterdam',
    limit: 50,
    geographyTypes: ['Municipality'],
    countrySet: ['NL'],
}).then((response) => {
    console.log('Results count with big limit specified and more strict filter', response.features?.length);
});
