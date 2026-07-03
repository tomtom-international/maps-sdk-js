import { useEffect, useState } from 'react';
import { focusFeature, getActiveToolState } from '../agent/agent-bridge';
import { type ProfileResult, useProfile } from '../results/results-store';
import { profileSite } from '../tools/profile-site';
import { KIND_COLOR } from '../viz/site-visuals';
import { setPanelActive, useIsTopPanel } from './active-panel-store';
import { CategoryIcon } from './category-icons';
import { captionClass, NoteBanner, PanelShell, title1Class, title2Class, title3Class, title4Class } from './panel-ui';

// Site Profile panel — the on-map analytics card from Figma (node 998:38739). Every metric lives
// here so the chat stays a one-liner. Styling uses the shared --pb-* design tokens (same system the
// chat + Figma share), so panel ↔ chat ↔ Figma stay in lockstep.

const WALK_RADII = [400, 800, 1200]; // metres
const DRIVE_MINUTES = [5, 10, 15];

const fmt = (counted: { count: number | null; capped: boolean }): string => {
    if (counted.count === null) return '—';
    return counted.capped ? `${counted.count.toLocaleString()}+` : counted.count.toLocaleString();
};

// Segmented control: track on surface-1, the active segment lifts to surface-0 with an e2 shadow.
function RadiusSwitcher({
    options,
    current,
    busy,
    onPick,
    format,
}: {
    options: number[];
    current: number;
    busy: boolean;
    onPick: (size: number) => void;
    format: (size: number) => string;
}) {
    return (
        <div className="flex w-full items-center gap-1 rounded-[32px] border border-(--pb-border-base) bg-(--pb-surface-1) p-0.5">
            {options.map((size) => {
                const active = size === current;
                return (
                    <button
                        key={size}
                        type="button"
                        disabled={busy}
                        onClick={() => onPick(size)}
                        className={`flex-1 cursor-pointer rounded-[32px] border px-3 py-1.5 text-center ${title4Class} transition-colors disabled:cursor-default disabled:opacity-50 ${
                            active
                                ? 'border-(--pb-border-low) bg-(--pb-surface-0) text-(--pb-text-high) shadow-[0px_2px_4px_-2px_rgba(17,12,34,0.12)]'
                                : 'border-transparent text-(--pb-text-medium) hover:text-(--pb-text-high)'
                        }`}
                    >
                        {format(size)}
                    </button>
                );
            })}
        </div>
    );
}

// Metric card — big number + label, optional caption and a brand-coloured corner dot.
function MetricCard({ value, label, caption, dot }: { value: string; label: string; caption?: string; dot?: string }) {
    return (
        <div className="relative flex flex-col rounded-[10px] border border-(--pb-border-base) bg-(--pb-surface-0) px-3 py-2">
            {dot && (
                <span aria-hidden className="absolute top-2 right-2 size-2 rounded-full" style={{ background: dot }} />
            )}
            <span className={`overflow-hidden text-ellipsis whitespace-nowrap ${title1Class} text-(--pb-text-high)`}>
                {value}
            </span>
            <span className={`${title3Class} text-(--pb-text-medium)`}>{label}</span>
            {caption && <span className={`${captionClass} text-(--pb-text-high) opacity-50`}>{caption}</span>}
        </div>
    );
}

/** Single-site profile panel — every metric lives here, so the chat stays a one-liner. */
export function ProfilePanel() {
    const data = useProfile();
    const [dismissed, setDismissed] = useState<ProfileResult | null>(null);
    const [busy, setBusy] = useState(false);
    const visible = !!data && data !== dismissed;
    const isTop = useIsTopPanel('profile');
    useEffect(() => {
        setPanelActive('profile', visible);
    }, [visible]);
    if (!visible) return null;

    // All site attributes live in the Point feature's properties (GeoJSON-feature result model).
    const p = data.site.properties;
    const walking = p.mode === 'walking';
    const currentSize = walking ? p.rerun.walkReachMeters : p.rerun.driveMinutes;

    // Re-run the profile with a tweaked catchment size — geocodes, rebuilds, recounts, redraws and
    // republishes (the panel then re-renders from the store). Buttons (not a live slider) so each
    // change is one deliberate API round-trip.
    const reprofile = (size: number): void => {
        const state = getActiveToolState();
        if (!state || busy || size === currentSize) return;
        setBusy(true);
        void Promise.resolve(
            profileSite.execute(
                {
                    address: p.rerun.address,
                    concept: p.rerun.concept,
                    competitorCategories: p.rerun.competitorCategories,
                    travelMode: p.mode,
                    walkReachMeters: walking ? size : p.rerun.walkReachMeters,
                    driveMinutes: walking ? p.rerun.driveMinutes : size,
                    includeParking: p.rerun.includeParking,
                },
                state,
            ),
        ).finally(() => setBusy(false));
    };

    return (
        <PanelShell title="Site Profile" onClose={() => setDismissed(data)} expanded={isTop}>
            {/* Address + radius switcher */}
            <div className="flex flex-col gap-2 px-4 pt-4">
                <button
                    type="button"
                    onClick={() => focusFeature(data.site, walking ? 15 : 13)}
                    title="Show on map"
                    className={`cursor-pointer border-0 bg-transparent p-0 text-left ${title2Class}`}
                >
                    {p.label}
                </button>
                <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-1 whitespace-nowrap text-(--pb-text-medium)">
                        <span className={`overflow-hidden text-ellipsis ${title4Class}`}>
                            {walking ? 'Walking radius' : 'Driving radius'}
                        </span>
                        <span className={`shrink-0 ${title3Class}`}>·</span>
                        <span className={`shrink-0 ${captionClass}`}>Area on map: {p.catchmentKm2}km²</span>
                    </div>
                    <RadiusSwitcher
                        options={walking ? WALK_RADII : DRIVE_MINUTES}
                        current={currentSize}
                        busy={busy}
                        onPick={reprofile}
                        format={(size) =>
                            walking ? (size >= 1000 ? `${size / 1000} km` : `${size} m`) : `${size} min`
                        }
                    />
                </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 gap-2 px-4 py-3">
                <MetricCard
                    value={fmt({ count: p.competitors.count, capped: p.competitors.capped })}
                    label="Competitors"
                    caption={
                        p.competitors.nearestMeters !== null
                            ? `nearest ${p.competitors.nearestMeters} m`
                            : 'none nearby'
                    }
                    dot={KIND_COLOR.competitor}
                />
                {p.parking && (
                    <MetricCard
                        value={fmt({ count: p.parking.count, capped: false })}
                        label="Parking"
                        caption={
                            p.parking.nearestMeters !== null ? `nearest ${p.parking.nearestMeters} m` : 'none nearby'
                        }
                        dot={KIND_COLOR.parking}
                    />
                )}
                <MetricCard value={fmt(p.households)} label="Households" />
            </div>

            {/* Honesty notes (kept from the data; the design omits them but they matter) */}
            {p.notes.length > 0 && (
                <div className="flex flex-col gap-2 px-4 pb-3">
                    {p.notes.map((note) => (
                        <NoteBanner key={note}>{note}</NoteBanner>
                    ))}
                </div>
            )}

            {/* Area make-up */}
            <div className="flex flex-col gap-1 bg-(--pb-surface-1) px-4 py-3">
                <span className={`${title3Class} text-(--pb-text-low)`}>Area make-up</span>
                <div className="flex flex-col">
                    {p.areaMakeup.map((bucket) => (
                        <div key={bucket.key} className="flex w-full items-center gap-2 py-1">
                            <CategoryIcon bucketKey={bucket.key} className="text-(--pb-text-medium)" />
                            <div className="flex min-h-6 flex-1 items-center justify-between font-(family-name:--pb-font-secondary) text-[14px] leading-[20px] font-bold">
                                <span className="truncate text-(--pb-text-medium)">{bucket.label}</span>
                                <span className={bucket.count === null ? 'text-(--pb-text-low)' : 'text-(--pb-text-high)'}>
                                    {fmt(bucket)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </PanelShell>
    );
}
