import { afterAll, describe, expect, test, vi } from 'vitest';
import { EventsModule } from '../EventsModule';
import type { EventsProxy } from '../EventsProxy';
import type { StyleSourceWithLayers } from '../SourceWithLayers';
import { EventHandlerConfig } from '../types';

const mockedMapModule = { source: { id: 'testModule' } } as StyleSourceWithLayers;
const mockConsoleError = vi.spyOn(global.console, 'error').mockImplementation(vi.fn());

describe('EventsModule tests', () => {
    const MockEventProxy = {
        addEventHandler: vi.fn(),
        remove: vi.fn(),
    } as unknown as EventsProxy;

    afterAll(() => {
        mockConsoleError.mockRestore();
    });

    test('Add an event', () => {
        const config: EventHandlerConfig = { cursorOnHover: 'none' };
        const event = new EventsModule(MockEventProxy, mockedMapModule, config);
        const callback = vi.fn();

        event.on('click', callback);

        expect(MockEventProxy.addEventHandler).toHaveBeenCalledWith(
            mockedMapModule,
            expect.any(Function),
            'click',
            config,
        );
    });

    test('Remove an event', () => {
        const event = new EventsModule(MockEventProxy, mockedMapModule, undefined);

        event.off('click');

        expect(MockEventProxy.remove).toHaveBeenCalledWith(mockedMapModule, 'click');
    });
});
