'use strict';
require('dotenv').config({ path: '../.env' });

const reverseGeocode = require('@tomtom-org/maps-sdk/services').reverseGeocode;
const TomTomConfig = require('@tomtom-org/maps-sdk/core').TomTomConfig;

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

reverseGeocode({ position: [5.72884, 52.33499] }).then((response) => console.log(response));
