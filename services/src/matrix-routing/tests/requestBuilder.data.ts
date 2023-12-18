import { FetchInput } from "../../shared/types/fetch";
import { CalculateMatrixRoutePOSTDataAPI } from "../types/apiRequestTypes";
import { CalculateMatrixRouteParams } from "../types/calculateMatrixRouteParams";

export const sdkAndAPIRequests: [string, CalculateMatrixRouteParams, FetchInput<CalculateMatrixRoutePOSTDataAPI>][] = [
    [
        "Calculate Matrix with out options",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            origins: [
                [4.89066, 52.37317],
                [4.49015, 52.16109]
            ],
            destinations: [
                [4.89432, 52.22222],
                [4.53422, 52.11111]
            ]
        },
        {
            method: "POST",
            url: new URL("https://api.tomtom.com/routing/matrix/2?key=GLOBAL_API_KEY"),
            data: {
                origins: [
                    {
                        point: {
                            latitude: 52.37317,
                            longitude: 4.89066
                        }
                    },
                    {
                        point: {
                            latitude: 52.16109,
                            longitude: 4.49015
                        }
                    }
                ],
                destinations: [
                    {
                        point: {
                            longitude: 4.89432,
                            latitude: 52.22222
                        }
                    },
                    {
                        point: {
                            longitude: 4.53422,
                            latitude: 52.11111
                        }
                    }
                ]
            }
        }
    ]
];
