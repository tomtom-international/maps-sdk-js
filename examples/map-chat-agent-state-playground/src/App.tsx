import { getDefaultToolPrompts } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { MapAgentChat } from './chat';
import { AnalyticsControlPanel } from './ui';
import { RightRail } from './ui/sidePanels';
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

export function App() {
    const { agent, transport, analyticsState, tokenUsage, classifications } = useMapAgent();

    return (
        <div className="absolute inset-0 flex flex-row-reverse gap-2 bg-(--ui-surface-0) p-2 max-sm:flex-col max-sm:gap-0 max-sm:p-0">
            {agent && <RightRail agent={agent} />}
            {/* `id="sdk-map"` is required — MapLibre attaches to the DOM node by ID. It appends its
                canvas rather than replacing children, so overlays can render inside it. */}
            <div
                id="sdk-map"
                className="relative flex-1 overflow-hidden rounded-[20px] bg-(--ui-surface-1) max-sm:min-h-0 max-sm:basis-1/2 max-sm:rounded-none"
            >
                {analyticsState && (
                    <AnalyticsControlPanel analytics={analyticsState.analytics} module={analyticsState.module} />
                )}
            </div>
            {transport ? (
                <MapAgentChat
                    transport={transport}
                    tokenUsage={tokenUsage}
                    label="Map Chat Agent"
                    classifications={classifications}
                    suggestedPrompts={SUGGESTED_PROMPTS}
                />
            ) : (
                <div className="flex w-[380px] flex-col bg-(--ui-surface-0) max-sm:w-full">
                    <div className="p-4 text-(--ui-text-med-em)">Initializing assistant...</div>
                </div>
            )}
        </div>
    );
}
