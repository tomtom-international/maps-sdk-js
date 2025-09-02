'use strict';
require('dotenv').config({ path: '../.env' });

const reverseGeocode = require('@cet/maps-sdk-js/services').reverseGeocode;
const TomTomConfig = require('@cet/maps-sdk-js/core').TomTomConfig;

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY });

reverseGeocode({ position: [5.72884, 52.33499] }).then((response) => console.log(response));
