import type { SDKServiceError } from '../errors';
import type { APIErrorResponse } from '../types/apiResponseErrorTypes';
import type { ServiceName } from '../types/servicesTypes';

const data: [string, APIErrorResponse, ServiceName, SDKServiceError][] = [
    [
        'Missing coordinates',
        {
            status: 400,
            message: 'Bad Request',
            data: {
                error: 'Invalid request: position is missing',
                httpStatusCode: 400,
                detailedError: {
                    code: 'BadRequest',
                    message: 'Invalid request: position is missing',
                    target: 'position',
                },
            },
        },
        'ReverseGeocode',
        {
            service: 'ReverseGeocode',
            message: 'Invalid request: position is missing',
            status: 400,
        } as SDKServiceError,
    ],
    [
        'Cannot parse position',
        {
            status: 400,
            message: 'Bad Request',
            data: {
                error: 'Invalid request: invalid position: cannot parse position.',
                httpStatusCode: 400,
                detailedError: {
                    code: 'BadRequest',
                    message: 'Invalid request: invalid position: cannot parse position.',
                    target: 'position',
                },
            },
        },
        'ReverseGeocode',
        {
            service: 'ReverseGeocode',
            message: 'Invalid request: invalid position: cannot parse position.',
            status: 400,
        } as SDKServiceError,
    ],
    [
        'Invalid Language code',
        {
            status: 400,
            message: 'Bad Request',
            data: {
                error: 'Invalid request: invalid language parameter: [ ]',
                httpStatusCode: 400,
                detailedError: {
                    code: 'BadRequest',
                    message: 'Invalid request: invalid language parameter: [ ]',
                    target: 'language',
                },
            },
        },
        'ReverseGeocode',
        {
            service: 'ReverseGeocode',
            message: 'Invalid request: invalid language parameter: [ ]',
            status: 400,
        } as SDKServiceError,
    ],
    [
        'latitude/longitude out of range.',
        {
            status: 400,
            message: 'Bad Request',
            data: {
                error: 'Invalid request: invalid position: latitude/longitude out of range.',
                httpStatusCode: 400,
                detailedError: {
                    code: 'BadRequest',
                    message: 'Invalid request: invalid position: latitude/longitude out of range.',
                    target: 'position',
                },
            },
        },
        'ReverseGeocode',
        {
            service: 'ReverseGeocode',
            message: 'Invalid request: invalid position: latitude/longitude out of range.',
            status: 400,
        } as SDKServiceError,
    ],
    [
        'URL not found error arising due to manipulating some required parameters',
        {
            status: 404,
            message: 'Not found',
            data: {
                httpStatusCode: 404,
                errorText: 'Not Found',
                detailedError: {
                    code: 'NotFound',
                    message: 'URL not found',
                    target: '',
                },
            },
        },
        'GeometrySearch',
        {
            service: 'GeometrySearch',
            message: 'Not Found',
            status: 404,
        } as SDKServiceError,
    ],
    [
        'Missing or invalid geometryList parameter',
        {
            status: 400,
            message: 'Bad Request',
            data: {
                errorText: 'Missing or invalid geometryList parameter',
                detailedError: {
                    code: 'BadRequest',
                    message: 'Missing or invalid geometryList parameter',
                    target: '',
                },
                httpStatusCode: 400,
            },
        },
        'GeometrySearch',
        {
            service: 'GeometrySearch',
            message: 'Missing or invalid geometryList parameter',
            status: 400,
        } as SDKServiceError,
    ],
    [
        "Error parsing 'geometryList'",
        {
            status: 400,
            message: 'Bad Request',
            data: {
                errorText: "Error parsing 'geometryList': Invalid positions found: 1234.8828,2.28266",
                detailedError: {
                    code: 'BadRequest',
                    message: "Error parsing 'geometryList': Invalid positions found: 1234.8828,2.28266",
                    target: 'geometryList',
                },
                httpStatusCode: 400,
            },
        },
        'GeometrySearch',
        {
            service: 'GeometrySearch',
            message: "Error parsing 'geometryList': Invalid positions found: 1234.8828,2.28266",
            status: 400,
        } as SDKServiceError,
    ],
    [
        'Incorrect Language',
        {
            status: 400,
            message: 'Bad Request',
            data: {
                errorText: "Error parsing 'language': Language tag 'XYZ' not supported",
                detailedError: {
                    code: 'BadRequest',
                    message: "Error parsing 'language': Language tag 'XYZ' not supported",
                    target: 'language',
                },
                httpStatusCode: 400,
            },
        },
        'Geocode',
        {
            service: 'Geocode',
            message: "Error parsing 'language': Language tag 'XYZ' not supported",
            status: 400,
        } as SDKServiceError,
    ],
    [
        'Empty Query',
        {
            status: 400,
            message: 'Bad Request',
            data: {
                errorText: 'Empty query allowed only with the filters provided or in wildcard context.',
                detailedError: {
                    code: 'BadRequest',
                    message: 'Empty query allowed only with the filters provided or in wildcard context.',
                    target: '',
                },
                httpStatusCode: 400,
            },
        },
        'Geocode',
        {
            service: 'Geocode',
            message: 'Empty query allowed only with the filters provided or in wildcard context.',
            status: 400,
        } as SDKServiceError,
    ],
];

export default data;
