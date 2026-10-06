import { useEffect, useState } from 'react';
import { focusFeature } from '../agent/agent-bridge';
import { type FactorWeights, resolveWeights, scoreSites } from '../agent/scoring';
import {
    FACTOR_LABELS,
    formatCounted,
    type RankedSite,
    type RankedSiteProps,
    type RankingResult,
    type ScoreFactor,
    skippedReason,
    useRanking,
} from '../results/results-store';
import { rankedSiteColor } from '../viz/score-colors';
import { restyleRankedSites } from '../viz/site-visuals';
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
    title2Class,
    titleStyle,
} from './panel-ui';
import { playbook } from './playbook-tokens';

type WeightPercents = Partial<FactorWeights>;

// A BYOD property name as words: "residentIncomeMillionEUR" reads "resident income million EUR".
const readableProperty = (property: string): string =>
    property
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z\d])([A-Z])/g, '$1 $2')
        .replace(/\b[A-Z][a-z]+\b/g, (word) => word.toLowerCase());

// What a factor read for a site, shown beside the points it earned; null when the site has no value.
const factorInput = (factor: ScoreFactor, site: RankedSiteProps, demandProperty: string | null): string | null => {
    switch (factor) {
        case 'reach':
            return site.households === null ? null : `${site.households.toLocaleString()} households`;
        case 'demand': {
            const demand = site.factors.demand;
            if (typeof demand !== 'number') return null;
            return `${Math.round(demand).toLocaleString()} ${demandProperty ? readableProperty(demandProperty) : ''}`.trim();
        }
        case 'competition':
            return site.competitors.count === null ? null : `${formatCounted(site.competitors)} competitors`;
        case 'accessibility':
            return site.nearestParkingMeters === null ? null : `nearest parking ${site.nearestParkingMeters} m`;
    }
};

/** Ranked-shortlist scoreboard (glass-box) with LIVE weight sliders — drag a weight and the scores +
 * order recompute client-side via the same pure scorer the tool used, and the map pins follow. Reads
 * the unified results store. */
export function ShortlistPanel() {
    const data = useRanking();
    const [dismissed, setDismissed] = useState<RankingResult | null>(null);
    // Slider values are PERCENTAGES of the decision, summing to 100 across the factors that actually
    // rank (scored). Held with the ranking they were set on, so a new ranking opens on the agent's weights.
    const [override, setOverride] = useState<{ ranking: RankingResult; percents: WeightPercents } | null>(null);
    const visible = !!data && data !== dismissed;
    const isTop = useIsTopPanel('shortlist');
    useEffect(() => {
        setPanelActive('shortlist', visible);
    }, [visible]);
    if (!visible) return null;

    const scored = data.scoredOn;
    // Normalize a weight set to integer percentages over `scored` that sum to exactly 100.
    const toPercents = (raw: FactorWeights): WeightPercents => {
        const total = scored.reduce((sum, f) => sum + Math.max(0, raw[f]), 0);
        const pct: WeightPercents = {};
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
    const activeOverride = override?.ranking === data ? override.percents : null;
    const percents = activeOverride ?? toPercents(data.weights);

    // Re-score live. Scored factors carry their % share; others stay (and are dropped by the scorer).
    // Without an override it's the agent's own weights, not their rounded %, so each row reads the
    // score the tool stored. Per-site `excluded` (e.g. catchment unavailable) survives any slider.
    const rankRows = (weightPercents: WeightPercents | null) => {
        const result = scoreSites(
            data.sites.features.map((site) => ({
                id: site.properties.label,
                values: site.properties.factors,
                excluded: site.properties.excluded?.reason,
            })),
            resolveWeights(weightPercents ?? undefined, data.weights),
        );
        const byLabel = new Map(data.sites.features.map((site) => [site.properties.label, site]));
        let rankCounter = 0;
        return result.ranked.map((entry) => ({
            site: byLabel.get(entry.id) as RankedSite,
            rank: entry.excluded ? null : ++rankCounter,
            score: entry.score,
            breakdown: entry.breakdown,
            excluded: entry.excluded,
        }));
    };
    const rows = rankRows(activeOverride);
    // A BYOD site is named after its pin, so a re-ranked one takes its new number; an address keeps its own.
    const rowLabel = ({ site, rank }: (typeof rows)[number]): string =>
        site.properties.byodNoun && rank !== null ? `${site.properties.byodNoun} ${rank}` : site.properties.label;

    // Set the sliders (null = back to the agent's weights) and re-rank the map pins to match the rows.
    const applyOverride = (next: WeightPercents | null): void => {
        setOverride(next && { ranking: data, percents: next });
        const styles = rankRows(next).map(
            (row) => [row.site.properties.label, { color: rankedSiteColor(row), number: row.rank }] as const,
        );
        void restyleRankedSites(new Map(styles));
    };

    // Drag one slider → set it, then redistribute the rest proportionally so the shares still total 100%.
    const rebalance = (factor: ScoreFactor, value: number): void => {
        const v = Math.max(0, Math.min(100, Math.round(value)));
        const others = scored.filter((f) => f !== factor);
        if (others.length === 0) return; // single factor → always 100%
        const sumOthers = others.reduce((sum, f) => sum + (percents[f] ?? 0), 0);
        const remaining = 100 - v;
        const next: WeightPercents = { ...percents, [factor]: v };
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
        applyOverride(next);
    };

    // Glass-box detail rows for a site: each factor with what it read and the points it earned, then
    // the factors that could not be scored (muted), so a count never stands apart from its points.
    const breakdownRows = (row: (typeof rows)[number]) => {
        const detail: { label: string; value: string; muted?: boolean }[] = [];
        if (row.excluded) {
            detail.push({ label: 'Excluded', value: row.excluded.reason, muted: true });
        } else {
            row.breakdown.forEach((entry) => {
                const input = factorInput(entry.factor, row.site.properties, data.demandProperty);
                const points = `${entry.points} ${entry.points === 1 ? 'pt' : 'pts'}`;
                detail.push({ label: FACTOR_LABELS[entry.factor], value: input ? `${input} · ${points}` : points });
            });
        }
        data.skipped.forEach((skip) =>
            detail.push({ label: FACTOR_LABELS[skip.factor], value: skippedReason(skip), muted: true }),
        );
        return detail;
    };

    return (
        <PanelShell title={`Shortlist: ${data.concept}`} onClose={() => setDismissed(data)} expanded={isTop}>
            <ol className="flex flex-col">
                {rows.map((row) => (
                    <li
                        key={row.site.properties.label}
                        onClick={() => focusFeature(row.site)}
                        title="Show on map"
                        className="flex cursor-pointer items-start gap-2 px-4 py-2 hover:bg-(--ui-surface-1)"
                    >
                        <RankBadge n={row.rank} />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex items-start justify-between gap-2">
                                <span className={`truncate ${title2Class}`}>{rowLabel(row)}</span>
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
                                            color: rankedSiteColor(row),
                                        }}
                                    >
                                        {row.excluded ? '—' : row.score}
                                    </span>
                                </span>
                            </div>
                            <ScoreBar value={row.excluded ? 0 : row.score} color={rankedSiteColor(row)} />
                            <ScoreBreakdown rows={breakdownRows(row)} />
                        </div>
                    </li>
                ))}
            </ol>

            {/* Adjustments — live weights + methodology notes */}
            <div className="flex flex-col gap-3 border-t border-(--ui-border-base-em) px-4 pt-3 pb-3">
                {scored.length >= 2 ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                            <span style={titleStyle}>Score weights</span>
                            {activeOverride && <ResetButton onClick={() => applyOverride(null)} />}
                        </div>
                        {scored.length === 2 ? (
                            <SplitSlider
                                leftLabel={FACTOR_LABELS[scored[0]]}
                                rightLabel={FACTOR_LABELS[scored[1]]}
                                leftPct={percents[scored[0]] ?? 0}
                                onChange={(v) => applyOverride({ [scored[0]]: v, [scored[1]]: 100 - v })}
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
                                        className="min-w-0 flex-1 accent-[var(--ui-surface-brand-red)]"
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
