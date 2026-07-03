// SINGLE SOURCE OF TRUTH for "how we measure things". Every place that explains a metric — the
// agent's answers (injected into the system prompt), the HTML report's Methodology + Not-measured
// sections — reads from here, so the explanation can never drift from the implementation. When a
// tool's calculation changes, update the matching entry here and every surface updates with it.

export type MethodologyEntry = {
    id: string;
    /** User-facing name of the metric/concept. */
    term: string;
    /** Precisely how it is computed — the formula / counting rule, in plain language. */
    method: string;
    /** The TomTom signal it is derived from. */
    source: string;
    /** Honest limitation — what it is NOT, so no one over-reads it. */
    caveat: string;
};

export const METHODOLOGY: MethodologyEntry[] = [
    {
        id: 'catchment',
        term: 'Catchment (trade area)',
        method: 'Walking: a circle of the chosen radius (default 800 m ≈ a 10-minute walk) around the geocoded site. Driving: a drive-time isochrone — the area reachable by road within N minutes. Every metric below is measured inside this catchment.',
        source: 'Geocoding + routing reachable-range (isochrone) APIs',
        caveat: 'The walking catchment is a straight-line radius, not a street-network walk distance.',
    },
    {
        id: 'reach',
        term: 'Reach (households)',
        method: 'A count of individual address points (PointAddress) found inside the catchment by an address search, up to a 100 ceiling. Used as a dwellings/households proxy.',
        source: 'Address search (point-address records inside the catchment)',
        caveat: 'Counts addressable points, not residents or population. It caps at 100, so in any populated area it saturates almost immediately and stops differentiating nearby sites — when that happens the scorer drops it.',
    },
    {
        id: 'demand',
        term: 'Demand (whitespace scan)',
        method: 'For each grid cell, the number of "demand-anchor" POIs — the categories chosen as proxies for what draws the concept\'s customers (e.g. café, supermarket, university) — within the walk radius of the cell\'s centre. A bring-your-own-data demand layer, when supplied, adds its own points to that count. For resident-serving concepts (daycare, pharmacy, GP), household-demand mode also blends in RESIDENTIAL density (address points per cell, 50/50 with the anchor signal). Each signal is min-max normalized across all cells.',
        source: 'POI category search for the chosen anchors; an optional bring-your-own-data demand layer; address search (point-address records) for residential density',
        caveat: 'A proxy for nearby activity / residents, NOT measured footfall or population. Determined by the chosen anchors. The residential sample caps at 100 addresses per scan, so it is a coarse relative density, not a true count.',
    },
    {
        id: 'competition',
        term: 'Competition',
        method: "The number of competitor/peer POIs (the concept's own category) inside the catchment, plus the straight-line distance to the nearest one.",
        source: 'POI category search inside the catchment',
        caveat: 'Counts presence and spacing only — not market share, revenue, quality, or how busy each rival is.',
    },
    {
        id: 'accessibility',
        term: 'Accessibility',
        method: 'The distance to the nearest parking and the count of parking POIs inside the catchment.',
        source: 'Parking POI search inside the catchment',
        caveat: 'Off-street / marked parking POIs only — not on-street capacity, pricing, or live availability. Traffic-based access would need the Area Analytics entitlement, which is not enabled here.',
    },
    {
        id: 'spend-power',
        term: 'Spend power (the ranking "Demand" factor)',
        method: 'Local income / spending power. This is NOT available from TomTom data, so it is scored only when you supply a demographics layer (bring-your-own GeoJSON). With none loaded, the factor is skipped — never estimated.',
        source: 'Optional bring-your-own demographics layer (none by default)',
        caveat: 'Distinct from the whitespace "Demand" metric above (which is anchor-POI density). Without a demographics layer this factor contributes nothing.',
    },
    {
        id: 'opportunity-score',
        term: 'Opportunity score (whitespace, 0–100)',
        method: '100 × (0.6 × demand + 0.4 × peer-proximity). "demand" is the normalized anchor density above; "peer-proximity" rewards being FAR from existing peers when colocation = avoid, or CLOSE when colocation = seek. Demand is weighted higher so a genuinely busy area outranks one that is merely far from rivals.',
        source: 'Derived from the Demand and peer-distance signals above',
        caveat: 'A relative screening score across the scanned cells, not an absolute or predictive figure.',
    },
    {
        id: 'site-score',
        term: 'Site score (ranking, 0–100)',
        method: "A weighted sum of the normalized factors Reach / Spend power / Competition / Accessibility, using your weights (default 30 / 30 / 25 / 15). Each factor is min-max normalized across ONLY the sites being compared, so scores are relative to that set. Gates exclude any site that fails a hard requirement (e.g. parking within 300 m) with a stated reason. The panel shows the glass-box breakdown — each factor's point contribution — plus a confidence flag based on how many factors had usable data.",
        source: 'Derived from the factor signals above',
        caveat: 'Relative screening scores within the compared set, not absolute or predictive. Factors that do not vary across the sites are dropped from the score.',
    },
    {
        id: 'overlap',
        term: 'Catchment overlap (cannibalization check)',
        method: 'The geometric intersection of two catchment areas — the shared area in km² and the percentage of the smaller catchment that overlaps.',
        source: 'Geometric intersection of the two catchment polygons',
        caveat: 'Geographic reach overlap only — NOT a revenue, sales, or customer-loss forecast.',
    },
];

// What we explicitly do NOT measure — the honest boundary, surfaced in both the report and the
// agent's context so neither over-claims.
export const NOT_MEASURED: string[] = [
    'Resident population or demographics (Reach is an address/dwellings proxy, not people)',
    'Income / spend power (the ranking factor is scored only when a demographics layer is supplied)',
    'Footfall / pedestrian volume, vehicle counts, or vehicle-type mix',
    'Revenue, sales, or financial cannibalization (overlap is geographic reach, not predicted revenue loss)',
];

/** Compact plain-text block for the system prompt so the agent can answer "how is X measured?". */
export const methodologyPromptBlock = (): string => {
    const lines = METHODOLOGY.map((e) => `- ${e.term}: ${e.method} (Source: ${e.source}. Note: ${e.caveat})`);
    return (
        'HOW WE MEASURE THINGS (METHODOLOGY) — when the user asks how a number, score, or metric is ' +
        'calculated, what it means, or where it comes from (demand, reach/households, competition, ' +
        'accessibility, spend power, opportunity score, site score, catchment, overlap, confidence), ' +
        'answer precisely and ONLY from this list, combined with the specific inputs you chose for ' +
        'their query (the anchor/competitor categories you searched, the radius, the weights). Quote ' +
        'the method and the caveat; never invent or guess a formula. If the thing they ask about is ' +
        'under "Not measured", say plainly that it is not measured and why.\n' +
        `${lines.join('\n')}\n` +
        `Not measured: ${NOT_MEASURED.join('; ')}.`
    );
};

const escapeHtml = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Methodology section for the HTML report (same content as the prompt block). */
export const methodologyReportHtml = (): string => {
    const items = METHODOLOGY.map(
        (e) => `<li><strong>${escapeHtml(e.term)}</strong> — ${escapeHtml(e.method)}</li>`,
    ).join('');
    return `<h2>Methodology &amp; data sources</h2>
  <p class="muted">All findings come from TomTom location data, queried live during this analysis.</p>
  <ul class="muted">${items}</ul>`;
};

/** "Not measured" callout for the HTML report. */
export const notMeasuredReportHtml = (): string => {
    const items = NOT_MEASURED.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('');
    return `<h2>Not measured</h2>
  <div class="callout">TomTom provides no data for the following, so this report makes <strong>no claims</strong> about them:
    <ul>${items}</ul>
    Validate shortlisted sites on the ground before committing.
  </div>`;
};
