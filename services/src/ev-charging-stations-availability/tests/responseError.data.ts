import { SDKServiceError, type ServiceName } from '../../shared';
import type { APIErrorResponse } from '../../shared/types/apiResponseErrorTypes';

export const errorResponses: Array<[string, APIErrorResponse, ServiceName, SDKServiceError]> = [
    [
        'Charging Availability: Min Power should be greater than 0',
        {
            status: 400,
            message: 'Bad Request',
            data: {
                error: 'Invalid Parameter.',
                httpStatusCode: 400,
                detailedError: {
                    code: 'InvalidParameter',
                    message: 'must be greater than 0',
                    target: '',
                },
            },
        },
        'ChargingAvailability',
        new SDKServiceError('must be greater than 0', 'ChargingAvailability', 400),
    ],
    [
        'Charging Availability: Param minPower & maxPower to be double',
        {
            status: 400,
            message: 'Bad Request',
            data: {
                error: 'Invalid Parameter Type.',
                httpStatusCode: 400,
                detailedError: {
                    code: 'InvalidParameterType',
                    message: 'Required Type: Double',
                    target: '',
                },
            },
        },
        'ChargingAvailability',
        new SDKServiceError('Required Type: Double', 'ChargingAvailability', 400),
    ],
];
