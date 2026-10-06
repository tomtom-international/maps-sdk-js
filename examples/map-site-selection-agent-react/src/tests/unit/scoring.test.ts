import { describe, expect, it } from 'vitest';
import {
    DEFAULT_WEIGHTS,
    describeDefaultWeights,
    type FactorWeights,
    resolveWeights,
    type SiteForScoring,
    scoreSites,
} from '../../agent/scoring';

// Few rivals but far from parking, against many rivals right next to it.
const sites: SiteForScoring[] = [
    { id: 'quiet', values: { competition: -1, accessibility: -600 } },
    { id: 'parked', values: { competition: -9, accessibility: -50 } },
];
const order = (weights: FactorWeights): string[] => scoreSites(sites, weights).ranked.map((site) => site.id);

describe('resolveWeights', () => {
    it('keeps the base weight of every factor a partial override leaves out', () => {
        const session: FactorWeights = { reach: 10, demand: 20, competition: 30, accessibility: 40 };
        expect(resolveWeights({ competition: 70 }, session)).toEqual({ ...session, competition: 70 });
    });
});

describe('ranking weights', () => {
    it('reorders the sites when the weights move from competition to accessibility', () => {
        expect(order({ ...DEFAULT_WEIGHTS, competition: 60, accessibility: 10 })).toEqual(['quiet', 'parked']);
        expect(order({ ...DEFAULT_WEIGHTS, competition: 10, accessibility: 60 })).toEqual(['parked', 'quiet']);
    });

    it('ranks the same on any scale, since weights are relative', () => {
        expect(order({ reach: 0.3, demand: 0.3, competition: 0.25, accessibility: 0.15 })).toEqual(
            order(DEFAULT_WEIGHTS),
        );
    });

    it('describes the default weights of the factors in play', () => {
        expect(describeDefaultWeights()).toBe(
            `demand ${DEFAULT_WEIGHTS.demand}, competition ${DEFAULT_WEIGHTS.competition}, accessibility ${DEFAULT_WEIGHTS.accessibility}`,
        );
    });
});
