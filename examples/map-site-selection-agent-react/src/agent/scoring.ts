/**
 * Pure, side-effect-free scoring for rankSites — a defensible, "glass-box" weighted model over four
 * factors (Reach / Spend power / Competition / Accessibility; the 'demand' key is income/spend power,
 * labelled "Spend power" to avoid clashing with findWhitespace's anchor-density "Demand"). No SDK
 * imports → unit-testable.
 *
 * Defensible mechanics:
 * - **Gates** — hard must-haves that EXCLUDE a site (with a reason) before scoring.
 * - **Glass-box breakdown** — every site reports each factor's POINTS contribution (summing ≈ score),
 *   so the panel/report can show "Score = Reach + Competition + Accessibility".
 * - **Skip non-differentiating factors** — a factor that's constant, all-missing, or <2 data points
 *   carries no ranking info and is dropped (reported), so it never flattens the spread.
 */

import type { ScoreFactor } from '../results/results-store';

export const SCORE_FACTORS: readonly ScoreFactor[] = ['reach', 'demand', 'competition', 'accessibility'];

export type FactorWeights = Record<ScoreFactor, number>;

// Geod's published split — a sensible, recognizable default; the user can override any of them.
export const DEFAULT_WEIGHTS: FactorWeights = { reach: 30, demand: 30, competition: 25, accessibility: 15 };

// Higher-is-better raw value per factor; null = not available for this site.
export type FactorValues = Partial<Record<ScoreFactor, number | null>>;

/** A hard requirement on a factor's raw (higher-is-better) value. Site is excluded if value < min. */
export type Gate = { factor: ScoreFactor; min: number; label: string };

// `excluded` pre-marks a site as not scorable (e.g. its catchment failed to build) — it is sunk to
// the bottom with that reason, never scored on its (meaningless) factor values.
export type SiteForScoring = { id: string; values: FactorValues; excluded?: string };
export type FactorContribution = { factor: ScoreFactor; points: number };
export type ScoredSite = {
    id: string;
    score: number;
    breakdown: FactorContribution[];
    excluded?: { reason: string };
};
export type SkippedFactor = { factor: ScoreFactor; reason: 'constant' | 'insufficient-data' | 'no-data' };
export type ScoreResult = { ranked: ScoredSite[]; usedFactors: ScoreFactor[]; skipped: SkippedFactor[] };

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export const resolveWeights = (weights?: Partial<FactorWeights>): FactorWeights => ({ ...DEFAULT_WEIGHTS, ...weights });

/**
 * Score sites 0–100 on the factors that vary across the (non-excluded) cohort, with a per-factor
 * points breakdown. Gates exclude must-have failures up front. Pillars that don't differentiate are
 * skipped; the composite averages only over the factors a site actually has.
 */
export const scoreSites = (
    sites: readonly SiteForScoring[],
    weights: FactorWeights,
    gates: readonly Gate[] = [],
): ScoreResult => {
    // 1. Gates — exclude sites failing any hard requirement (null counts as failing).
    const gateReason = (site: SiteForScoring): string | null => {
        for (const gate of gates) {
            const value = site.values[gate.factor];
            if (value === null || value === undefined || value < gate.min) return gate.label;
        }
        return null;
    };
    const excluded = new Map<string, string>();
    const eligible: SiteForScoring[] = [];
    for (const site of sites) {
        if (site.excluded) {
            excluded.set(site.id, site.excluded); // pre-excluded (e.g. catchment unavailable)
            continue;
        }
        const reason = gateReason(site);
        if (reason !== null) excluded.set(site.id, reason);
        else eligible.push(site);
    }

    // 2. Min-max normalize each differentiating factor across the eligible cohort.
    const normalizedByFactor = new Map<ScoreFactor, Map<string, number>>();
    const usedFactors: ScoreFactor[] = [];
    const skipped: SkippedFactor[] = [];
    for (const factor of SCORE_FACTORS) {
        const present = eligible.filter((site) => typeof site.values[factor] === 'number');
        if (present.length === 0) {
            skipped.push({ factor, reason: 'no-data' });
            continue;
        }
        if (present.length < 2) {
            skipped.push({ factor, reason: 'insufficient-data' });
            continue;
        }
        const values = present.map((site) => site.values[factor] as number);
        const min = Math.min(...values);
        const max = Math.max(...values);
        if (max === min) {
            skipped.push({ factor, reason: 'constant' });
            continue;
        }
        const perSite = new Map<string, number>();
        for (const site of present)
            perSite.set(site.id, clamp01(((site.values[factor] as number) - min) / (max - min)));
        normalizedByFactor.set(factor, perSite);
        usedFactors.push(factor);
    }

    // 3. Weighted composite + per-factor points contribution (sums ≈ score) for the glass-box view.
    const scoreOne = (site: SiteForScoring): ScoredSite => {
        const excludedReason = excluded.get(site.id);
        if (excludedReason) return { id: site.id, score: 0, breakdown: [], excluded: { reason: excludedReason } };

        let weightTotal = 0;
        const contributions: { factor: ScoreFactor; weight: number; norm: number }[] = [];
        for (const factor of usedFactors) {
            const norm = normalizedByFactor.get(factor)?.get(site.id);
            if (norm === undefined) continue;
            const weight = weights[factor] ?? 0;
            contributions.push({ factor, weight, norm });
            weightTotal += weight;
        }
        const breakdown: FactorContribution[] = contributions.map((entry) => ({
            factor: entry.factor,
            points: weightTotal > 0 ? Math.round(((entry.weight * entry.norm) / weightTotal) * 100) : 0,
        }));
        const score = breakdown.reduce((sum, entry) => sum + entry.points, 0);
        return { id: site.id, score, breakdown };
    };

    const scored = sites.map(scoreOne);
    // Eligible sites ranked by score desc; excluded sites sink to the bottom.
    const ranked = [...scored].sort((a, b) => {
        if (a.excluded && !b.excluded) return 1;
        if (b.excluded && !a.excluded) return -1;
        return b.score - a.score;
    });
    return { ranked, usedFactors, skipped };
};
