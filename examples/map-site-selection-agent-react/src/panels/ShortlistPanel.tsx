import { useEffect, useState } from 'react';
import { focusFeature } from '../agent/agent-bridge';
import { type FactorWeights, resolveWeights, scoreSites } from '../agent/scoring';
import {
    FACTOR_LABELS,
    type RankedSite,
    type RankingResult,
    type ScoreFactor,
    useRanking,
} from '../results/results-store';
import { setPanelActive, useIsTopPanel } from './active-panel-store';
import {
    captionStyle,
    FooterSection,
    PanelShell,
    RankBadge,
    ResetButton,
    ScoreBar,
    ScoreBreakdown,
    SplitSlider,
    StatusTag,
    scoreColor,
    title2Class,
    titleStyle,
} from './panel-ui';
import { playbook } from './playbook-tokens';

/** Ranked-shortlist scoreboard (glass-box) with LIVE weight sliders — drag a weight and the scores +
 * order recompute client-side via the same pure scorer the tool used. Reads the unified results store. */
export function ShortlistPanel() {
    const data = useRanking();
    const [dismissed, setDismissed] = useState<RankingResult | null>(null);
    // Slider values are PERCENTAGES of the decision, summing to 100 across the factors that actually
    // rank (scored). null = the agent's weights; otherwise the user's live override.
    const [override, setOverride] = useState<Partial<Record<ScoreFactor, number>> | null>(null);
    const visible = !!data && data !== dismissed;
    const isTop = useIsTopPanel('shortlist');
    useEffect(() => {
        setPanelActive('shortlist', visible);
    }, [visible]);
    if (!visible) return null;

    const scored = data.scoredOn;
    // Normalize a weight set to integer percentages over `scored` that sum to exactly 100.
    const toPercents = (raw: FactorWeights): Partial<Record<ScoreFactor, number>> => {
        const total = scored.reduce((sum, f) => sum + Math.max(0, raw[f]), 0);
        const pct: Partial<Record<ScoreFactor, number>> = {};
        let acc = 0;
        scored.forEach((factor, i) => {
            if (i === scored.length - 1) {
                pct[factor] = Math.max(0, 100 - acc);
            } else {
                const v =
                    total > 0 ? Math.round((Math.max(0, raw[factor]) / total) * 100) : Math.round(100 / scored.length);
                pct[factor] = v;
                acc += v;
            }
        });
        return pct;
    };
    const percents = override ?? toPercents(resolveWeights(data.weights));

    // Drag one slider → set it, then redistribute the rest proportionally so the shares still total 100%.
    const rebalance = (factor: ScoreFactor, value: number): void => {
        const v = Math.max(0, Math.min(100, Math.round(value)));
        const others = scored.filter((f) => f !== factor);
        if (others.length === 0) return; // single factor → always 100%
        const sumOthers = others.reduce((sum, f) => sum + (percents[f] ?? 0), 0);
        const remaining = 100 - v;
        const next: Partial<Record<ScoreFactor, number>> = { ...percents, [factor]: v };
        let acc = 0;
        others.forEach((f, i) => {
            if (i === others.length - 1) next[f] = Math.max(0, remaining - acc);
            else {
                const share = sumOthers > 0 ? (percents[f] ?? 0) / sumOthers : 1 / others.length;
                const nv = Math.round(share * remaining);
                next[f] = nv;
                acc += nv;
            }
        });
        setOverride(next);
    };

    // Re-score live. Scored factors carry their % share; others stay (and are dropped by the scorer).
    // Per-site `excluded` (e.g. catchment unavailable) is preserved regardless of the slider values.
    const weights = { ...resolveWeights(data.weights), ...percents } as FactorWeights;
    const result = scoreSites(
        data.sites.features.map((site) => ({
            id: site.properties.label,
            values: site.properties.factors,
            excluded: site.properties.excluded?.reason,
        })),
        weights,
    );
    const byLabel = new Map(data.sites.features.map((site) => [site.properties.label, site]));
    let rankCounter = 0;
    const rows = result.ranked.map((entry) => ({
        site: byLabel.get(entry.id) as RankedSite,
        rank: entry.excluded ? null : ++rankCounter,
        score: entry.score,
        breakdown: entry.breakdown,
        excluded: entry.excluded,
    }));

    // Glass-box detail rows for a site: contextual metrics, then each factor's points, then the
    // factors that could not be scored (muted) so the collapsed row stays a one-liner.
    const breakdownRows = (row: (typeof rows)[number]) => {
        const p = row.site.properties;
        const detail: { label: string; value: string; muted?: boolean }[] = [];
        if (p.households !== null) detail.push({ label: 'Households', value: `+${p.households.toLocaleString()}` });
        if (p.competitorCount !== null) detail.push({ label: 'Rivals', value: String(p.competitorCount) });
        if (row.excluded) {
            detail.push({ label: 'Excluded', value: row.excluded.reason, muted: true });
        } else {
            row.breakdown.forEach((entry) =>
                detail.push({ label: FACTOR_LABELS[entry.factor], value: String(entry.points) }),
            );
        }
        data.skipped.forEach((skip) =>
            detail.push({ label: FACTOR_LABELS[skip.factor], value: skip.reason, muted: true }),
        );
        return detail;
    };

    return (
        <PanelShell title={`Shortlist — ${data.concept}`} onClose={() => setDismissed(data)} expanded={isTop}>
            <ol className="flex flex-col">
                {rows.map((row) => (
                    <li
                        key={row.site.properties.label}
                        onClick={() => focusFeature(row.site)}
                        title="Show on map"
                        className="flex cursor-pointer items-start gap-2 px-4 py-2 hover:bg-(--pb-surface-1)"
                    >
                        <RankBadge n={row.rank} />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex items-start justify-between gap-2">
                                <span className={`truncate ${title2Class}`}>{row.site.properties.label}</span>
                                <span className="flex shrink-0 items-end gap-1">
                                    <span style={{ ...captionStyle, color: playbook.text.medEm, fontWeight: 600 }}>
                                        {row.excluded ? '' : 'score'}
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: playbook.font.headings,
                                            fontWeight: 700,
                                            fontSize: '20px',
                                            lineHeight: '24px',
                                            color: row.excluded ? playbook.text.lowEm : scoreColor(row.score),
                                        }}
                                    >
                                        {row.excluded ? '—' : row.score}
                                    </span>
                                </span>
                            </div>
                            <ScoreBar
                                value={row.excluded ? 0 : row.score}
                                color={row.excluded ? playbook.text.lowEm : scoreColor(row.score)}
                            />
                            <ScoreBreakdown rows={breakdownRows(row)} />
                        </div>
                    </li>
                ))}
            </ol>

            {/* Adjustments — live weights + methodology notes */}
            <div className="flex flex-col gap-3 border-t border-(--pb-border-base) px-4 pt-3 pb-3">
                {scored.length >= 2 ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                            <span style={titleStyle}>Score weights</span>
                            {override && <ResetButton onClick={() => setOverride(null)} />}
                        </div>
                        {scored.length === 2 ? (
                            <SplitSlider
                                leftLabel={FACTOR_LABELS[scored[0]]}
                                rightLabel={FACTOR_LABELS[scored[1]]}
                                leftPct={percents[scored[0]] ?? 0}
                                onChange={(v) => setOverride({ [scored[0]]: v, [scored[1]]: 100 - v })}
                            />
                        ) : (
                            scored.map((factor) => (
                                <label key={factor} className="flex items-center gap-2">
                                    <span style={captionStyle} className="w-24 shrink-0 truncate">
                                        {FACTOR_LABELS[factor]}
                                    </span>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={percents[factor] ?? 0}
                                        onChange={(e) => rebalance(factor, Number(e.target.value))}
                                        className="min-w-0 flex-1 accent-[var(--pb-primary-color)]"
                                    />
                                    <span style={captionStyle} className="w-9 shrink-0 text-right tabular-nums">
                                        {percents[factor] ?? 0}%
                                    </span>
                                </label>
                            ))
                        )}
                    </div>
                ) : (
                    scored.length === 1 && (
                        <span style={captionStyle}>
                            Only {FACTOR_LABELS[scored[0]]} differs across these sites, so it's 100% of the score.
                        </span>
                    )
                )}
                <span style={captionStyle}>
                    {data.mode} · confidence {data.confidence}
                    {data.competitorsMatchedBy
                        ? ` · competitors: ${data.competitorsMatchedBy.replace('categories: ', '')}`
                        : ''}
                </span>
            </div>

            {data.skipped.length > 0 && (
                <FooterSection title="Not scored">
                    <div className="flex flex-wrap gap-1">
                        {data.skipped.map((skip) => (
                            <StatusTag key={skip.factor}>{FACTOR_LABELS[skip.factor]}</StatusTag>
                        ))}
                    </div>
                </FooterSection>
            )}
            {data.gates.length > 0 && (
                <FooterSection title="Gates">
                    <div className="flex flex-wrap gap-1">
                        {data.gates.map((gate) => (
                            <StatusTag key={gate}>{gate}</StatusTag>
                        ))}
                    </div>
                </FooterSection>
            )}
        </PanelShell>
    );
}
