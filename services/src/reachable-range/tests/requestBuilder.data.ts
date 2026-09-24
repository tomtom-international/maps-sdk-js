import type { FetchInput } from '../../shared';
import type { ReachableRangeParams } from '../types/reachableRangeParams';

export const sdkAndAPIRequests: [string, ReachableRangeParams, FetchInput][] = [
    [
        'Time-based reachable range',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            origin: [10.123, 20.567],
            budget: { type: 'timeMinutes', value: 30 },
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateReachableRange/20.567,10.123/json?apiVersion=2&key=GLOBAL_API_KEY&timeBudgetInSec=1800&smoothing=strong',
            ),
        },
    ],
    [
        'Time-based reachable range with departure date',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            origin: [10.123, 20.567],
            budget: { type: 'timeMinutes', value: 60 },
            when: { option: 'departAt', date: new Date(Date.UTC(2030, 8, 16, 15, 0)) },
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateReachableRange/20.567,10.123/json?apiVersion=2&key=GLOBAL_API_KEY' +
                    '&departAt=2030-09-16T15%3A00%3A00.000Z&timeBudgetInSec=3600&smoothing=strong',
            ),
        },
    ],
    [
        'EV reachable range until remaining charge',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            origin: [-10.123567, -20.567],
            budget: { type: 'remainingChargeCPT', value: 20 },
            vehicle: {
                engineType: 'electric',
                model: {
                    engine: {
                        consumption: {
                            speedsToConsumptionsKWH: [
                                { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
                                { speedKMH: 130, consumptionUnitsPer100KM: 21.3 },
                            ],
                        },
                        charging: { maxChargeKWH: 200 },
                    },
                },
                state: { currentChargePCT: 80 },
            },
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateReachableRange/-20.567,-10.123567/json?apiVersion=2&key=GLOBAL_API_KEY' +
                    '&vehicleEngineType=electric&constantSpeedConsumptionInkWhPerHundredkm=50%2C8.2%3A130%2C21.3' +
                    '&maxChargeInkWh=200&currentChargeInkWh=160&energyBudgetInkWh=120&smoothing=strong',
            ),
        },
    ],
    [
        'EV reachable range for spent charge',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            origin: [-10.123567, -20.567],
            budget: { type: 'spentChargePCT', value: 50 },
            vehicle: {
                engineType: 'electric',
                model: {
                    engine: {
                        consumption: {
                            speedsToConsumptionsKWH: [
                                { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
                                { speedKMH: 130, consumptionUnitsPer100KM: 21.3 },
                            ],
                        },
                        charging: { maxChargeKWH: 85 },
                    },
                },
                state: { currentChargePCT: 80 },
            },
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateReachableRange/-20.567,-10.123567/json?apiVersion=2&key=GLOBAL_API_KEY' +
                    '&vehicleEngineType=electric&constantSpeedConsumptionInkWhPerHundredkm=50%2C8.2%3A130%2C21.3' +
                    '&maxChargeInkWh=85&currentChargeInkWh=68&energyBudgetInkWh=42.5&smoothing=strong',
            ),
        },
    ],
    [
        // The two vehicle parameters this endpoint accepts. Asserted by whole-request equality, so
        // any other vehicle parameter the shared builder might append fails this case.
        'Vehicle weight and max speed are the only vehicle parameters sent',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            origin: [10.123, 20.567],
            budget: { type: 'timeMinutes', value: 30 },
            vehicle: {
                model: { dimensions: { weightKG: 3500 } },
                restrictions: { maxSpeedKMH: 80 },
            },
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateReachableRange/20.567,10.123/json?apiVersion=2&key=GLOBAL_API_KEY' +
                    '&vehicleWeight=3500&vehicleMaxSpeed=80&timeBudgetInSec=1800&smoothing=strong',
            ),
        },
    ],
    [
        // The service holds this vehicle's battery model, so the variant stands on its own —
        // charging preferences are a charging-stops parameter and have no place beside it here.
        'EV reachable range for a predefined vehicle variant',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            origin: [10.123, 20.567],
            budget: { type: 'timeMinutes', value: 30 },
            vehicle: {
                engineType: 'electric',
                model: { variantId: '54B969E8-E28D-11EC-8FEA-0242AC120002' },
            },
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateReachableRange/20.567,10.123/json?apiVersion=2&key=GLOBAL_API_KEY' +
                    '&vehicleEngineType=electric&vehicleModelId=54B969E8-E28D-11EC-8FEA-0242AC120002' +
                    '&timeBudgetInSec=1800&smoothing=strong',
            ),
        },
    ],
    [
        'Distance-based reachable range',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            origin: [-10.123567, -20.567],
            budget: { type: 'distanceKM', value: 200 },
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateReachableRange/-20.567,-10.123567/json?apiVersion=2&key=GLOBAL_API_KEY&distanceBudgetInMeters=200000&smoothing=strong',
            ),
        },
    ],
];
