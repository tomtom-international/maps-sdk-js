import { methodologyReportHtml, notMeasuredReportHtml } from '../agent/methodology';
import {
    FACTOR_LABELS,
    getResultsSnapshot,
    type RankingResult,
    type ScoreFactor,
    type WhitespaceResult,
} from '../results/results-store';

// Builds a styled, print-to-PDF HTML report from the RESULTS STORE — not from agent-transcribed
// numbers, so the report can never drift from the panels. Self-contained (inline CSS), opened in a
// new tab or downloaded. Sections render only for analyses that actually ran; Methodology and the
// mandatory "Not measured" caveats are always appended.

export type ReportSpec = { title: string; concept?: string; area?: string; date: string };

const esc = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const num = (value: number | null, suffix = ''): string =>
    value === null ? '—' : `${value.toLocaleString()}${suffix}`;

const STYLE = `
  :root { --ink:#111827; --muted:#5c5c5c; --line:#e5e5e5; --accent:#0a3653; --warn-bg:#fff7ed; --warn-line:#fdba74; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; color: var(--ink); max-width: 880px; margin: 40px auto; padding: 0 24px; line-height: 1.5; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  h2 { font-size: 18px; margin: 32px 0 8px; padding-bottom: 6px; border-bottom: 2px solid var(--accent); }
  .meta { color: var(--muted); font-size: 13px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 14px; }
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--line); }
  th { color: var(--muted); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .03em; }
  td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; }
  .card { border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; margin: 8px 0; }
  .kpis { display: flex; gap: 28px; flex-wrap: wrap; }
  .kpi .v { font-size: 22px; font-weight: 700; }
  .kpi .l { color: var(--muted); font-size: 12px; }
  .muted { color: var(--muted); font-size: 13px; }
  .bar { height: 6px; background: #f2f2f2; border-radius: 6px; overflow: hidden; }
  .bar > span { display: block; height: 100%; background: var(--accent); }
  .callout { background: var(--warn-bg); border: 1px solid var(--warn-line); border-radius: 8px; padding: 12px 14px; font-size: 13px; }
  .excluded { color: #b91c1c; }
  footer { margin-top: 40px; color: var(--muted); font-size: 12px; border-top: 1px solid var(--line); padding-top: 10px; }
  @media print { body { margin: 0; } h2 { break-after: avoid; } table, .card { break-inside: avoid; } }
`;

const factorList = (weights: Record<ScoreFactor, number>): string =>
    (['reach', 'demand', 'competition', 'accessibility'] as ScoreFactor[])
        .map((f) => `${FACTOR_LABELS[f]} ${weights[f]}`)
        .join(' · ');

const rankingSection = (ranking: RankingResult): string => {
    const rows = ranking.sites.features
        .map(({ properties: site }) => {
            if (site.excluded) {
                return `<tr><td>#${site.rank}</td><td>${esc(site.label)}</td><td colspan="4" class="excluded">Excluded — ${esc(site.excluded.reason)}</td></tr>`;
            }
            const breakdown = site.breakdown.map((b) => `${FACTOR_LABELS[b.factor]} ${b.points}`).join(' + ');
            return `<tr>
              <td>#${site.rank}</td><td>${esc(site.label)}</td>
              <td class="n"><strong>${site.score}</strong></td>
              <td class="muted">${esc(breakdown)}</td>
              <td class="n">${num(site.households)}</td>
              <td class="n">${num(site.competitorCount)}</td>
            </tr>`;
        })
        .join('');
    const skipped = ranking.skipped.length
        ? `<p class="muted">Not scored (no variation/data): ${ranking.skipped.map((s) => FACTOR_LABELS[s.factor]).join(', ')}.</p>`
        : '';
    const gates = ranking.gates.length
        ? `<p class="muted">Gates applied: ${ranking.gates.map(esc).join('; ')}.</p>`
        : '';
    return `<h2>Ranked shortlist — ${esc(ranking.concept)}</h2>
      <p class="muted">${esc(ranking.mode)} catchments · weights ${esc(factorList(ranking.weights))} · confidence ${ranking.confidence}.</p>
      <table><thead><tr><th>#</th><th>Site</th><th class="n">Score</th><th>Breakdown</th><th class="n">Households</th><th class="n">Rivals</th></tr></thead><tbody>${rows}</tbody></table>
      ${gates}${skipped}`;
};

const profileSection = (profile: NonNullable<ReturnType<typeof getResultsSnapshot>['profile']>): string => {
    const p = profile.site.properties;
    const makeup = p.areaMakeup
        .map(
            (bucket) =>
                `<tr><td>${esc(bucket.label)}</td><td class="n">${bucket.count === null ? '—' : `${bucket.count}${bucket.capped ? '+' : ''}`}</td></tr>`,
        )
        .join('');
    return `<h2>Site profile — ${esc(p.label)}</h2>
      <p class="muted">${esc(p.mode)} · ${esc(p.basis)} · ${p.catchmentKm2} km²</p>
      <div class="kpis card">
        <div class="kpi"><div class="v">${p.households.count === null ? '—' : `${p.households.count.toLocaleString()}${p.households.capped ? '+' : ''}`}</div><div class="l">Households (reach)</div></div>
        <div class="kpi"><div class="v">${num(p.competitors.count)}</div><div class="l">Competitors${p.competitors.nearestMeters !== null ? ` · nearest ${p.competitors.nearestMeters} m` : ''}</div></div>
        <div class="kpi"><div class="v">${p.parking ? num(p.parking.count) : '—'}</div><div class="l">Parking${p.parking?.nearestMeters != null ? ` · nearest ${p.parking.nearestMeters} m` : ''}</div></div>
      </div>
      <table><thead><tr><th>Area make-up</th><th class="n">POIs</th></tr></thead><tbody>${makeup}</tbody></table>`;
};

const overlapSection = (overlap: NonNullable<ReturnType<typeof getResultsSnapshot>['overlap']>): string => {
    const rows = overlap.pairs
        .map(
            (pair) =>
                `<tr><td>${esc(pair.existing.properties.label)}</td><td class="n">${pair.overlapKm2} km²</td><td class="n">${pair.pctOfProposed}%</td><td class="n">${pair.pctOfExisting}%</td></tr>`,
        )
        .join('');
    return `<h2>Cannibalization — ${esc(overlap.proposed.properties.label)}</h2>
      <p class="muted">${overlap.proposedSharedPct}% of the proposed catchment (${overlap.proposed.properties.catchmentKm2} km²) is already covered by the existing network. ${esc(overlap.basis)}.</p>
      <table><thead><tr><th>Existing site</th><th class="n">Overlap</th><th class="n">% of proposed</th><th class="n">% of theirs</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="muted">Geographic reach overlap only — not a revenue or customer-loss estimate.</p>`;
};

const whitespaceSection = (whitespace: NonNullable<ReturnType<typeof getResultsSnapshot>['whitespace']>): string => {
    const closestOf = (pocket: WhitespaceResult['pockets']['features'][number]): string =>
        pocket.properties.nearestDemand.length
            ? pocket.properties.nearestDemand.map((poi) => `${esc(poi.name)} (${poi.meters} m)`).join(', ')
            : '—';
    const rows = whitespace.pockets.features
        .map((pocket, index) => {
            const w = pocket.properties;
            return `<tr><td>#${index + 1} ${esc(w.color)}</td><td class="n">${w.opportunity}</td><td class="n">${w.demand}</td><td class="n">${num(w.nearestTargetMeters, ' m')}</td><td>${w.beyondWalk ? 'genuine gap' : 'least-served'}</td><td>${closestOf(pocket)}</td></tr>`;
        })
        .join('');
    // Demand make-up: how many POIs of each category drive the demand signal (fuller than the legend).
    const compRows = whitespace.demandComposition
        .map((entry) => `<tr><td>${esc(entry.category)}</td><td class="n">${entry.count}</td></tr>`)
        .join('');
    const composition = whitespace.demandComposition.length
        ? `<table><thead><tr><th>Demand category</th><th class="n">POIs</th></tr></thead><tbody>${compRows}</tbody></table>`
        : '';
    return `<h2>Opportunity whitespace — ${esc(whitespace.area)}</h2>
      <p class="muted">Goal: ${esc(whitespace.goal)} · ${whitespace.pocketsMeetingGoal} of ${whitespace.pockets.features.length} pockets meet it.</p>
      <table><thead><tr><th>Pocket</th><th class="n">Opportunity</th><th class="n">Demand</th><th class="n">Nearest peer</th><th>Type</th><th>Closest demand POIs</th></tr></thead><tbody>${rows}</tbody></table>
      <h3>Demand make-up</h3>
      <p class="muted">Demand is a count of these nearby POIs — ${esc(whitespace.anchorsMatchedBy.replace('categories: ', ''))}.</p>
      ${composition}`;
};

/** Assemble the full HTML report from the current results-store snapshot. */
export const buildReportHtml = (spec: ReportSpec): string => {
    const snapshot = getResultsSnapshot();
    const sections: string[] = [];
    if (snapshot.ranking) sections.push(rankingSection(snapshot.ranking));
    if (snapshot.profile) sections.push(profileSection(snapshot.profile));
    if (snapshot.overlap) sections.push(overlapSection(snapshot.overlap));
    if (snapshot.whitespace) sections.push(whitespaceSection(snapshot.whitespace));

    const metaRows = [
        spec.concept && `Concept: ${esc(spec.concept)}`,
        spec.area && `Area: ${esc(spec.area)}`,
        `Date: ${esc(spec.date)}`,
        'Data: TomTom location services',
    ]
        .filter(Boolean)
        .join(' · ');

    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(spec.title)}</title><style>${STYLE}</style></head><body>
    <h1>${esc(spec.title)}</h1>
    <div class="meta">${metaRows}</div>
    ${sections.join('\n') || '<p class="muted">No analyses have been run yet — run a profile, ranking, comparison or whitespace scan first.</p>'}
    ${methodologyReportHtml()}
    ${notMeasuredReportHtml()}
    <footer>Generated by the TomTom Site Selection agent — experimental. Figures are relative screening signals, not forecasts.</footer>
    </body></html>`;
};

/** True when at least one analysis is available to report on. */
export const hasResults = (): boolean => {
    const snapshot = getResultsSnapshot();
    return Boolean(snapshot.ranking || snapshot.profile || snapshot.overlap || snapshot.whitespace);
};
