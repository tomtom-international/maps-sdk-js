import { useEffect, useState } from 'react';
import { type OverlapResult, useOverlap } from '../results/results-store';
import { OVERLAP_COLOR } from '../viz/site-visuals';
import { setPanelActive, useIsTopPanel } from './active-panel-store';
import { captionStyle, PanelShell, RankBadge, ScoreBar, ScoreBreakdown, title2Class } from './panel-ui';

const OVERLAP_PINK = OVERLAP_COLOR; // cannibalization accent (Figma) — headline % + bar fill (shared with the map)

/**
 * Catchment-overlap (cannibalization) panel for the latest compareCatchments result. The per-store
 * bar is the % of the PROPOSED catchment that overlaps that existing store — higher = more shared
 * walk/drive reach. Geographic reach only; never a revenue figure (the banner says so).
 */
export function CatchmentOverlapPanel() {
    const data = useOverlap();
    const [dismissed, setDismissed] = useState<OverlapResult | null>(null);
    const visible = !!data && data !== dismissed;
    const isTop = useIsTopPanel('overlap');
    useEffect(() => {
        setPanelActive('overlap', visible);
    }, [visible]);
    if (!visible) return null;

    // Small overlap %s (single digits) would make near-invisible bars, so scale each bar relative to
    // the largest overlap in the set for readability — the true % stays the headline number.
    const maxPct = Math.max(...data.pairs.map((pair) => pair.pctOfProposed), 1);

    return (
        <PanelShell title="Cannibalization" onClose={() => setDismissed(data)} expanded={isTop}>
            <div className="flex flex-col gap-0.5 px-4 pt-3 pb-1">
                <span className={`truncate ${title2Class}`}>{data.proposed.properties.label}</span>
                <span style={captionStyle}>
                    Geographic reach overlap only — not a revenue or customer-loss estimate.
                </span>
            </div>

            <ol className="flex flex-col">
                {data.pairs.map((pair, index) => (
                    <li key={pair.existing.properties.label} className="flex items-start gap-2 px-4 py-2">
                        <RankBadge n={index + 1} />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex items-baseline justify-between gap-2">
                                <span className={`truncate ${title2Class}`}>{pair.existing.properties.label}</span>
                                <span
                                    className="shrink-0 font-(family-name:--ui-font-gilroy) text-[20px] leading-[24px] font-bold"
                                    style={{ color: OVERLAP_PINK }}
                                >
                                    {pair.pctOfProposed}%
                                </span>
                            </div>
                            <ScoreBar value={(pair.pctOfProposed / maxPct) * 100} color={OVERLAP_PINK} />
                            <ScoreBreakdown
                                rows={[
                                    { label: 'Shared area', value: `${pair.overlapKm2} km²` },
                                    { label: 'Of their catchment', value: `${pair.pctOfExisting}%` },
                                ]}
                            />
                        </div>
                    </li>
                ))}
            </ol>
        </PanelShell>
    );
}
