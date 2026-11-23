import { describe, expect, it } from 'vitest';
import { toChatError } from '../ChatError';

describe('toChatError', () => {
    it('summarises a 429 status and keeps the raw message as details', () => {
        const error = Object.assign(new Error('quota exhausted'), { statusCode: 429 });
        expect(toChatError(error)).toEqual({
            summary: 'Rate limit exceeded. Retry shortly.',
            details: 'quota exhausted',
        });
    });

    it('reads the wait from a Too Many Requests message', () => {
        expect(toChatError(new Error('Too Many Requests: retry after 12 seconds')).summary).toBe(
            'Rate limit exceeded. Wait 12 seconds, then retry.',
        );
    });

    it('falls back to a generic summary', () => {
        const message = 'Type validation failed for messages[26].parts[3].input';
        expect(toChatError(new Error(message))).toEqual({
            summary: "The agent couldn't answer that message.",
            details: message,
        });
    });

    it('accepts a non-Error value and leaves out empty details', () => {
        expect(toChatError('offline')).toEqual({
            summary: "The agent couldn't answer that message.",
            details: 'offline',
        });
        expect(toChatError(undefined)).toEqual({
            summary: "The agent couldn't answer that message.",
            details: undefined,
        });
    });
});
