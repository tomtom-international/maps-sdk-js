import type { TomTomAPIHeaders } from '@tomtom-org/maps-sdk/core';

/**
 * GET object with URL and optional service-specific API headers.
 * @ignore
 */
export type GetObject = { url: URL; headers?: TomTomAPIHeaders };

/**
 * POST object with URL, optional payload, and optional service-specific API headers.
 * @ignore
 */
export type PostObject<D> = { url: URL; data?: D; headers?: TomTomAPIHeaders };

/**
 * Hybrid HTTP fetch input, supporting different HTTP methods such as GET and POST.
 * * GET method comes with a URL and optional headers.
 * * POST method comes with a URL, optional POST data, and optional headers.
 * @ignore
 */
export type FetchInput<PostData = void> = ({ method: 'GET' } & GetObject) | ({ method: 'POST' } & PostObject<PostData>);

export type ParsedFetchResponse<T> = Promise<{
    data: Promise<T>;
    status: number;
}>;
