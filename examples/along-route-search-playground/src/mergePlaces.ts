type PlacePage = {
    features: { id?: string | number }[];
};

/**
 * Up to `limit` places, taken in turns across the stretches.
 *
 * Along-route search orders each page by detour time, from that stretch's own start. A stretch
 * that fills its page would otherwise take the whole list and hide every stretch after it.
 */
export const mergePlaces = <Page extends PlacePage>(pages: readonly Page[], limit: number): Page => {
    const first = pages[0];
    if (!first) throw new Error('Along-route search had no stretch to query.');

    const seen = new Set<string>();
    const features: Page['features'] = [];
    const pending = pages.map((page) => page.features.values());
    while (features.length < limit) {
        const before = features.length;
        for (const places of pending) {
            for (const feature of places) {
                const id = String(feature.id);
                if (seen.has(id)) continue;
                seen.add(id);
                features.push(feature);
                break;
            }
            if (features.length === limit) break;
        }
        if (features.length === before) break;
    }
    return { ...first, features };
};
