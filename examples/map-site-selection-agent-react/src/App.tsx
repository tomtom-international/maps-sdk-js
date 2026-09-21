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
// map-rich tool: profileSite, rankSites, and the bring-your-own-data path (addByodSource → rankSites
// over a loaded layer). The BYOD prompt points at a public GeoJSON of the City of Las Vegas' named
// neighbourhoods so tapping it actually loads real features. The rest cover compareCatchments and the
// "what can you do?" catch-all.
const SUGGESTED_PROMPTS = [
    'Profile the area around The Venetian hotel for a new EV charging station.',
    'Which has the best highway access for a new warehouse — Harry Reid Airport, North Las Vegas or Henderson?',
    'Load these Las Vegas neighborhoods from https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/las-vegas.geojson, keep only the 10 closest to the Las Vegas Strip, and rank them for a new supermarket within a 10-minute drive.',
    'Would a new hardware store on S Rainbow Blvd in Spring Valley take customers from my store at 9705 W Charleston Blvd in Summerlin?',
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
        <div className="absolute inset-0 flex flex-row-reverse gap-2 bg-(--ui-surface-0) p-2 max-sm:flex-col max-sm:gap-0 max-sm:p-0">
            {/* `id="sdk-map"` is required — MapLibre attaches to the DOM node by ID. */}
            <div
                id="sdk-map"
                className="relative flex-1 overflow-hidden rounded-[20px] bg-(--ui-surface-1) max-sm:min-h-0 max-sm:basis-1/2 max-sm:rounded-none"
            >
                {/* MapLibre mounts into this inner element so the panel tree stays React-managed. */}
                <div id="map-container" className="absolute inset-0" />
                {/* Result panels live in the top-left corner. Only the most-recently-activated one shows
                    (see active-panel-store), so this column holds a single card that scrolls on its own.
                    The column ignores pointer events so the map stays draggable; each card re-enables them
                    for itself. */}
                <div className="no-scrollbar pointer-events-none absolute top-0 left-0 z-10 flex max-h-full w-[304px] max-w-full flex-col gap-2 overflow-y-auto p-3 pb-4">
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
                        onResizePointerDown={isMobile ? undefined : startResize} // We move the handle inside the chat viewport so the resize icon maintains the chat scrolling behavior
                    />
                ) : (
                    <div className="w-full p-4 text-(--ui-text-med-em)">Initializing assistant...</div>
                )}
            </div>
        </div>
    );
}
