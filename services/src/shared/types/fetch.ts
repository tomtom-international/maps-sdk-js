import { PostObject } from "../fetch";

/**
 * Hybrid HTTP fetch input, supporting different HTTP methods such as GET and POST.
 * * GET method comes with a URL.
 * * POST method comes with a URL and optional POST data.
 */
export type FetchInput<POST_DATA = void> = { method: "GET"; url: URL } | ({ method: "POST" } & PostObject<POST_DATA>);
