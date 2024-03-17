import type { ReachableRangeParams } from "../types/reachableRangeParams";

export const sdkAndAPIRequests: [string, ReachableRangeParams, URL][] = [
    [
        "Time-based reachable range",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            origin: [10.123, 20.567],
            budget: { type: "timeMinutes", value: 30 }
        },
        new URL(
            "https://api.tomtom.com/routing/1/calculateReachableRange/20.567,10.123/json?key=GLOBAL_API_KEY&timeBudgetInSec=1800"
        )
    ],
    [
        "Time-based reachable range with departure date",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            origin: [10.123, 20.567],
            budget: { type: "timeMinutes", value: 60 },
            when: { option: "departAt", date: new Date(Date.UTC(2030, 8, 16, 15, 0)) }
        },
        new URL(
            "https://api.tomtom.com/routing/1/calculateReachableRange/20.567,10.123/json?key=GLOBAL_API_KEY" +
                "&departAt=2030-09-16T15%3A00%3A00.000Z&timeBudgetInSec=3600"
        )
    ],
    [
        "EV reachable range until remaining charge",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            origin: [-10.123567, -20.567],
            budget: { type: "remainingChargeCPT", value: 20 }
            // vehicle: {
            //     engine: {
            //         type: "electric",
            //         currentChargePCT: 80,
            //         model: {
            //             charging: { maxChargeKWH: 200 },
            //             consumption: {
            //                 speedsToConsumptionsKWH: [
            //                     { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
            //                     { speedKMH: 130, consumptionUnitsPer100KM: 21.3 }
            //                 ]
            //             }
            //         }
            //     }
            // }
        },
        new URL(
            "https://api.tomtom.com/routing/1/calculateReachableRange/-20.567,-10.123567/json?key=GLOBAL_API_KEY" +
                "&vehicleEngineType=electric&constantSpeedConsumptionInkWhPerHundredkm=50%2C8.2%3A130%2C21.3" +
                "&maxChargeInkWh=200&currentChargeInkWh=160&energyBudgetInkWh=120"
        )
    ],
    [
        "EV reachable range for spent charge",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            origin: [-10.123567, -20.567],
            budget: { type: "spentChargePCT", value: 50 }
            // vehicle: {
            //     engine: {
            //         type: "electric",
            //         currentChargePCT: 80,
            //         model: {
            //             charging: { maxChargeKWH: 85 },
            //             consumption: {
            //                 speedsToConsumptionsKWH: [
            //                     { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
            //                     { speedKMH: 130, consumptionUnitsPer100KM: 21.3 }
            //                 ]
            //             }
            //         }
            //     }
            // }
        },
        new URL(
            "https://api.tomtom.com/routing/1/calculateReachableRange/-20.567,-10.123567/json?key=GLOBAL_API_KEY" +
                "&vehicleEngineType=electric&constantSpeedConsumptionInkWhPerHundredkm=50%2C8.2%3A130%2C21.3" +
                "&maxChargeInkWh=85&currentChargeInkWh=68&energyBudgetInkWh=42.5"
        )
    ],
    [
        "Distance-based reachable range",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            origin: [-10.123567, -20.567],
            budget: { type: "distanceKM", value: 200 }
        },
        new URL(
            "https://api.tomtom.com/routing/1/calculateReachableRange/-20.567,-10.123567/json?key=GLOBAL_API_KEY&distanceBudgetInMeters=200000"
        )
    ]
];
