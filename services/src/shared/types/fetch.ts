/**
 * POST object with URL and optional payload.
 * @ignore
 */
export type PostObject<D> = { url: URL; data?: D };

/**
 * Hybrid HTTP fetch input, supporting different HTTP methods such as GET and POST.
 * * GET method comes with a URL.
 * * POST method comes with a URL and optional POST data.
 * @ignore
 */
export type FetchInput<POST_DATA = void> = { method: "GET"; url: URL } | ({ method: "POST" } & PostObject<POST_DATA>);

export type ParsedFetchResponse<T> = Promise<{
    data: Promise<T>;
    status: number;
}>;
