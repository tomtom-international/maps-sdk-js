import type { SDKServiceError } from '../../shared';
import type { APIErrorResponse, RoutingAPIResponseError } from '../../shared/types/apiResponseErrorTypes';

export const errorResponses: Array<[string, APIErrorResponse<RoutingAPIResponseError>, SDKServiceError]> = [
    [
        'Thrill route > 900 Kms',
        {
            status: 400,
            message: 'Bad Request',
            data: {
                formatVersion: '0.0.12',
                error: {
                    description: 'Route requests with routeType=thrilling for distances over 900km are not supported.',
                },
                detailedError: {
                    message: 'Route requests with routeType=thrilling for distances over 900km are not supported.',
                    code: 'BAD_INPUT',
                },
            },
        },
        {
            service: 'Routing',
            message: 'Route requests with routeType=thrilling for distances over 900km are not supported.',
            status: 400,
        } as SDKServiceError,
    ],
    [
        'Vehicle max speed > 250',
        {
            status: 400,
            message: 'Bad Request',
            data: {
                formatVersion: '0.0.12',
                error: {
                    description:
                        'Invalid value for vehicleMaxSpeed: 251. Value must be an integer in the range [0, 250]',
                },
                detailedError: {
                    message: 'Invalid value for vehicleMaxSpeed: 251. Value must be an integer in the range [0, 250]',
                    code: 'BAD_INPUT',
                },
            },
        },
        {
            service: 'Routing',
            message: 'Invalid value for vehicleMaxSpeed: 251. Value must be an integer in the range [0, 250]',
            status: 400,
        } as SDKServiceError,
    ],
    [
        'No Route found',
        {
            status: 400,
            message: 'Bad Request',
            data: {
                formatVersion: '0.0.12',
                error: {
                    description:
                        'Engine error while executing route request: NO_ROUTE_FOUND: route search failed between origin and waypoint 1',
                },
                detailedError: {
                    message:
                        'Engine error while executing route request: NO_ROUTE_FOUND: route search failed between origin and waypoint 1',
                    code: 'NO_ROUTE_FOUND',
                },
            },
        },
        {
            service: 'Routing',
            message:
                'Engine error while executing route request: NO_ROUTE_FOUND: route search failed between origin and waypoint 1',
            status: 400,
        } as SDKServiceError,
    ],
];
