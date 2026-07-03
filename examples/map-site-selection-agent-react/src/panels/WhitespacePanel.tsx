import { useEffect, useState } from 'react';
import { focusFeature } from '../agent/agent-bridge';
import { pocketColor } from '../pocket-colors';
import { useWhitespace, type WhitespacePocket, type WhitespaceResult } from '../results/results-store';
import { setPanelActive, useIsTopPanel } from './active-panel-store';
import {
    captionStyle,
    FooterSection,
    NoteBanner,
    PanelShell,
    RankBadge,
    ResetButton,
    ScoreBar,
    ScoreBreakdown,
    SplitSlider,
    StatusTag,
    title1Class,
    title2Class,
    titleStyle,
} from './panel-ui';
import { playbook } from './playbook-tokens';

// Whether a pocket satisfies the colocation goal — mirrors the tool's own goalMet logic so the
// panel matches the report and chat.
const meetsGoal = (pocket: WhitespacePocket, colocation: WhitespaceResult['colocation']): boolean =>
    colocation === 'avoid'
        ? pocket.properties.beyondWalk
        : pocket.properties.nearestTargetMeters !== null && !pocket.properties.beyondWalk;

/** Opportunity-pockets panel for the latest findWhitespace scan. Rows mirror the numbered map pins. */
export function WhitespacePanel() {
    const data = useWhitespace();
    const [dismissed, setDismissed] = useState<WhitespaceResult | null>(null);
    // null = the tool's default 60/40 blend; otherwise the user's live demand-weight override.
    const [demandPct, setDemandPct] = useState<number | null>(null);
    const visible = !!data && data !== dismissed;
    const isTop = useIsTopPanel('whitespace');
    useEffect(() => {
        setPanelActive('whitespace', visible);
    }, [visible]);
    if (!visible) return null;

    // Re-blend demand vs. peer-proximity live and re-rank the shown pockets (map labels stay fixed —
    // each row keeps its #number + colour so it still maps to its hex).
    const pct = demandPct ?? 60;
    const w = pct / 100;
    const ranked = data.pockets.features
        .map((feature, originalIndex) => ({
            feature,
            originalIndex,
            opp: Math.round(100 * (w * feature.properties.demandNorm + (1 - w) * feature.properties.peerNorm)),
        }))
        .sort((a, b) => b.opp - a.opp);

    const goalLabel = data.colocation === 'avoid' ? 'gap' : 'in cluster';
    const metPlural = data.colocation === 'avoid' ? 'genuine gaps' : 'inside a cluster';
    const noneMessage =
        data.colocation === 'avoid'
            ? `No genuine gaps — ${data.area} is already well-served, so the pockets below are only the least-served busy spots.`
            : 'None of these sit inside an existing cluster — they are just the closest available spots.';

    const breakdownRows = ({ feature }: { feature: WhitespacePocket }) => {
        const { demand, households, nearestTargetMeters } = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;
        const detail: { label: string; value: string; muted?: boolean }[] = [
            { label: 'Location', value: `${lat.toFixed(4)}, ${lng.toFixed(4)}` },
            { label: 'Demand', value: String(demand) },
        ];
        if (households !== null) detail.push({ label: 'Households', value: `~${households.toLocaleString()}` });
        detail.push({
            label: 'Nearest peer',
            value: nearestTargetMeters !== null ? `${nearestTargetMeters} m` : 'none',
            muted: nearestTargetMeters === null,
        });
        detail.push({
            label: 'Meets goal',
            value: meetsGoal(feature, data.colocation)
                ? goalLabel
                : data.colocation === 'avoid'
                  ? 'least-served'
                  : 'not clustered',
            muted: !meetsGoal(feature, data.colocation),
        });
        return detail;
    };

    return (
        <PanelShell title="Opportunities" onClose={() => setDismissed(data)} expanded={isTop}>
            <div className="flex flex-col gap-1 px-4 pt-3 pb-1">
                <span className={`${title2Class} first-letter:uppercase`}>{data.goal}</span>
                {data.pocketsMeetingGoal === 0 ? (
                    <NoteBanner>{noneMessage}</NoteBanner>
                ) : (
                    <span style={captionStyle}>
                        {data.pocketsMeetingGoal} of {data.pockets.features.length}{' '}
                        {data.pocketsMeetingGoal === 1 ? 'is a genuine gap' : `are ${metPlural}`}.
                    </span>
                )}
            </div>

            <ol className="flex flex-col">
                {ranked.map(({ feature, originalIndex, opp }) => {
                    const hue = pocketColor(originalIndex).hex;
                    return (
                        <li
                            key={feature.properties.color}
                            onClick={() => focusFeature(feature, 15)}
                            title="Show on map"
                            className="flex cursor-pointer items-start gap-2 px-4 py-2 hover:bg-(--pb-surface-1)"
                        >
                            <RankBadge n={originalIndex + 1} />
                            <div className="flex min-w-0 flex-1 flex-col">
                                <div className="flex items-start gap-2">
                                    <div className="flex h-6 min-w-0 flex-1 items-center">
                                        <ScoreBar value={opp} color={hue} />
                                    </div>
                                    <span className="flex shrink-0 flex-col items-end">
                                        <span className={title1Class} style={{ color: hue }}>
                                            {opp}
                                        </span>
                                        <span style={{ ...captionStyle, color: playbook.text.medEm, fontWeight: 600 }}>
                                            score
                                        </span>
                                    </span>
                                </div>
                                {/* -mt-4: hang the disclosure 8px under the bar, not under the taller score stack */}
                                <div className="-mt-4">
                                    <ScoreBreakdown rows={breakdownRows({ feature })} />
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ol>

            {/* Re-rank — live demand ↔ peer-proximity blend + methodology notes */}
            <div className="mx-4 border-t border-(--pb-border-base)" />
            <div className="flex flex-col gap-2 px-4 pt-3 pb-3">
                <div className="flex items-center justify-between gap-2">
                    <span style={titleStyle}>Re-rank</span>
                    {demandPct !== null && <ResetButton onClick={() => setDemandPct(null)} />}
                </div>
                <SplitSlider
                    leftLabel="Demand"
                    rightLabel="Proximity peers"
                    leftPct={pct}
                    onChange={(v) => setDemandPct(v)}
                />
                {data.targetMatchedBy && (
                    <span style={captionStyle}>Peers: {data.targetMatchedBy.replace('categories: ', '')}</span>
                )}
                {data.anchorsMatchedBy && (
                    <span style={captionStyle}>
                        Demand = nearby places within the walk radius:{' '}
                        {data.anchorsMatchedBy.replace('categories: ', '')}
                    </span>
                )}
            </div>

            {data.demandLegend.length > 0 && (
                <FooterSection title="POIs on the map" titleStyle={{ fontSize: '14px', lineHeight: '20px' }}>
                    <div className="flex flex-wrap gap-1">
                        {data.demandLegend.map((item) => (
                            <StatusTag key={item.label}>
                                <span className="flex items-center gap-1.5 capitalize">
                                    <span
                                        aria-hidden
                                        className="inline-block size-2 shrink-0 rounded-full"
                                        style={{ background: item.color }}
                                    />
                                    {item.label}
                                </span>
                            </StatusTag>
                        ))}
                    </div>
                </FooterSection>
            )}

            {data.warnings && data.warnings.length > 0 && (
                <div className="flex flex-col gap-2 px-4 pt-1 pb-3">
                    {data.warnings.map((warning) => (
                        <NoteBanner key={warning}>{warning}</NoteBanner>
                    ))}
                </div>
            )}
        </PanelShell>
    );
}
