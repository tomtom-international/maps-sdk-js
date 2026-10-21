import { getDefaultToolPrompts } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { MapAgentChat } from './chat';
import { AnalyticsControlPanel } from './ui';
import { useMapAgent } from './useMapAgent';

const toolPrompts = getDefaultToolPrompts();

// Starter suggestions pulled from each tool's own `examplePrompts` — the registry stays the source
// of truth, so a prompt edit there flows here automatically. We hand-pick one prompt per tool to
// keep the panel diverse and to skip prompts that assume prior state (most `processData` /
// `analyseData` entries chain off earlier results, so we pick ones the LLM can plan end-to-end).
const SUGGESTED_PROMPTS: readonly string[] = [
    toolPrompts.discoverPlaces[0],
    toolPrompts.setRoute[0],
    toolPrompts.findReachableAreas[1],
    toolPrompts.getTrafficIncidents[0],
    toolPrompts.getTrafficAreaAnalytics[0],
    toolPrompts.analyseData[8],
    toolPrompts.processData[6],
    toolPrompts.setMapStandardStyle[0],
    toolPrompts.locatePlace[4],
    toolPrompts.flyTo[0],
].filter((p): p is string => typeof p === 'string');

const MIN_CHAT_WIDTH = 320; // px
const DEFAULT_CHAT_WIDTH = 380; // px — initial width; drag the handle to resize

// Centred 8px above the map's bottom edge, clear of the panels along its sides and of the copyright attribution
// in the bottom-right, which nothing may cover.
// Pointer events off so the map stays draggable under it.
function DemoOnlyPill() {
    return (
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-[4.5px] rounded-full bg-[#004B7F]/80 px-[9px] py-[4.5px] font-(family-name:--ui-font-proxima) text-[9.75px] leading-[13.5px] font-semibold text-white">
            <svg viewBox="0 0 24 24" width="13.5" height="13.5" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" transform="translate(12 12) scale(.62) translate(-11 -12)" />
            </svg>
            <span>Demo only</span>
        </div>
    );
}

export function App() {
    const { transport, analyticsState, tokenUsage } = useMapAgent();

    // Drag-resizable chat width (desktop only). Capped at half the viewport — "to the middle".
    const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 640px)');
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    const startResize = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        // The chat sits on the left (flex-row-reverse); its left edge ≈ the 8px page padding, so the
        // dragged right edge gives the width. Clamp between a sensible min and half the viewport.
        const onMove = (ev: PointerEvent) => {
            const max = Math.max(MIN_CHAT_WIDTH, window.innerWidth / 2);
            setChatWidth(Math.min(Math.max(ev.clientX - 8, MIN_CHAT_WIDTH), max));
        };
        const onUp = () => {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }, []);

    return (
        <div className="absolute inset-0 flex flex-row-reverse gap-2 bg-(--ui-surface-0) p-2 max-sm:flex-col max-sm:gap-0 max-sm:p-0">
            {/* `id="sdk-map"` is required — MapLibre attaches to the DOM node by ID. It appends its
                canvas rather than replacing children, so overlays can render inside it. */}
            <div
                id="sdk-map"
                className="relative flex-1 overflow-hidden rounded-[20px] bg-(--ui-surface-1) max-sm:min-h-0 max-sm:basis-1/2 max-sm:rounded-none"
            >
                {analyticsState && (
                    <AnalyticsControlPanel analytics={analyticsState.analytics} module={analyticsState.module} />
                )}
                <DemoOnlyPill />
            </div>
            {/* Chat column — fixed-but-resizable width on desktop, full width on mobile. */}
            <div className="relative flex shrink-0 max-sm:w-full" style={isMobile ? undefined : { width: chatWidth }}>
                {transport ? (
                    <MapAgentChat
                        transport={transport}
                        tokenUsage={tokenUsage}
                        suggestedPrompts={SUGGESTED_PROMPTS}
                        onResizePointerDown={isMobile ? undefined : startResize} // We move the handle inside the chat viewport so the resize icon maintains the chat scrolling behavior
                    />
                ) : (
                    <div className="w-full p-4 text-(--ui-text-med-em)">Initializing assistant...</div>
                )}
            </div>
        </div>
    );
}
