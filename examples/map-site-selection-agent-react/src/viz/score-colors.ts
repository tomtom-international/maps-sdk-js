import { playbook } from '../panels/playbook-tokens';
import type { RankedSiteProps } from '../results/results-store';

// Score → colour scale from the Figma shortlist (title-1 score + matching bar): green high, blue
// mid, grey low. Carried as raw hex because the design system exposes these as data-viz values, not
// surface tokens.
const SCORE_GREEN = '#4ca262';
const SCORE_BLUE = '#3c5c98';
const SCORE_GREY = '#5c5c5c';

const scoreColor = (value: number): string => (value >= 60 ? SCORE_GREEN : value >= 30 ? SCORE_BLUE : SCORE_GREY);

/** A ranked site's colour, shared by its Shortlist row, map pin and catchment: its score band, muted when excluded. */
export const rankedSiteColor = (site: Pick<RankedSiteProps, 'score' | 'excluded'>): string =>
    site.excluded ? playbook.text.lowEm : scoreColor(site.score);
