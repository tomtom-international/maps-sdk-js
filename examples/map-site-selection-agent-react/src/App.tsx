import { useCallback, useEffect, useState } from 'react';
import { MapAgentChat } from './chat';
import { useAgentSettings } from './hooks/useAgentSettings';
import { CatchmentOverlapPanel } from './panels/CatchmentOverlapPanel';
import { ProfilePanel } from './panels/ProfilePanel';
import { ShortlistPanel } from './panels/ShortlistPanel';
import { WhitespacePanel } from './panels/WhitespacePanel';
import { useMapAgent } from './useMapAgent';

// Start-screen copy (verbatim): title + one-line tagline.
const WELCOME_TEXT = [
    '# Site Selection Agent',
    'This agent allows you to plan for your next expansion by leveraging highly accurate map data and smart agentic tools.',
].join('\n\n');

// Start-screen prompt cards. The first three (shown before "More prompts") each open a distinct,
// map-rich tool: profileSite, findWhitespace, and the bring-your-own-data path (addByodSource →
// rankSites over a loaded layer). The BYOD prompt points at a public Berlin districts GeoJSON (the 12
// Bezirke) so tapping it actually loads real features. The rest cover rankSites, compareCatchments
// and the "what can you do?" catch-all.
const SUGGESTED_PROMPTS = [
    'Profile the area around Messe Berlin for a new EV charging station.',
    'Where in Prenzlauer Berg is there unmet demand for a gym within a 10-minute walk?',
    'Load these Berlin districts from https://raw.githubusercontent.com/m-hoerz/berlin-shapes/master/berliner-bezirke.geojson and rank them for a new supermarket.',
    'Which has the best motorway access for a warehouse — BER airport, Großbeeren or Spandau?',
    'Would a new hardware store in Tempelhof take customers from my store in Neukölln?',
    'What can you do? Show me a few things I can ask.',
] as const;

const MIN_CHAT_WIDTH = 320; // px
const DEFAULT_CHAT_WIDTH = 380; // px — initial width; drag the handle to resize

export function App() {
    const { settings } = useAgentSettings();
    const { transport } = useMapAgent({ deploymentId: settings.deploymentId });

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
        <div className="absolute inset-0 flex flex-row-reverse gap-2 bg-(--pb-surface-0) p-2 max-sm:flex-col max-sm:gap-0 max-sm:p-0">
            {/* `id="sdk-map"` is required — MapLibre attaches to the DOM node by ID. */}
            <div
                id="sdk-map"
                className="relative flex-1 overflow-hidden rounded-[20px] bg-(--pb-surface-1) max-sm:min-h-0 max-sm:basis-1/2 max-sm:rounded-none"
            >
                {/* MapLibre mounts into this inner element so the panel tree stays React-managed. */}
                <div id="map-container" className="absolute inset-0" />
                {/* Result panels live in the top-left corner. Only the most-recently-activated one shows
                    (see active-panel-store), so this column holds a single card that scrolls on its own —
                    no shared scrollbar. The column ignores pointer events so the map stays draggable; each
                    card re-enables them for itself. Scrollbar hidden via .no-scrollbar. */}
                <div className="no-scrollbar pointer-events-none absolute top-2 left-2 z-10 flex max-h-[calc(100%-1rem)] w-[280px] max-w-[calc(100%-1rem)] flex-col gap-2 overflow-y-auto">
                    <ProfilePanel />
                    <ShortlistPanel />
                    <CatchmentOverlapPanel />
                    <WhitespacePanel />
                </div>
            </div>

            {/* Chat column — fixed-but-resizable width on desktop, full width on mobile. */}
            <div className="relative flex shrink-0 max-sm:w-full" style={isMobile ? undefined : { width: chatWidth }}>
                {transport ? (
                    <MapAgentChat
                        transport={transport}
                        label="Site Selection Agent"
                        welcomeText={WELCOME_TEXT}
                        suggestedPrompts={SUGGESTED_PROMPTS}
                    />
                ) : (
                    <div className="w-full p-4 text-(--pb-text-medium)">Initializing assistant...</div>
                )}

                {/* Drag handle on the chat's inner (map-facing) edge — resize up to half the screen. */}
                {!isMobile && (
                    <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Resize chat"
                        onPointerDown={startResize}
                        className="group absolute top-0 right-0 z-20 flex h-full w-3 translate-x-1/2 cursor-col-resize items-center justify-center gap-0.5"
                    >
                        <span className="h-10 w-0.5 rounded-full bg-(--pb-text-low) transition-colors group-hover:bg-(--pb-text-high) group-active:bg-(--pb-text-high)" />
                        <span className="h-10 w-0.5 rounded-full bg-(--pb-text-low) transition-colors group-hover:bg-(--pb-text-high) group-active:bg-(--pb-text-high)" />
                    </div>
                )}
            </div>
        </div>
    );
}
